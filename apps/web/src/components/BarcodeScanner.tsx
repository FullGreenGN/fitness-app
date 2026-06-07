import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BarcodeProductResult {
	name: string;
	brand: string | null;
	imageUrl: string | null;
	servingSize: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

interface BarcodeScannerProps {
	onProductFound: (product: BarcodeProductResult) => void;
	onCancel: () => void;
}

// ─── Internal phase type ──────────────────────────────────────────────────────

type Phase = "scanning" | "loading" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export function BarcodeScanner({ onProductFound, onCancel }: BarcodeScannerProps) {
	const [phase, setPhase] = useState<Phase>("scanning");

	// Keep stable refs so the scanner closure never captures stale values
	const onFoundRef = useRef(onProductFound);
	onFoundRef.current = onProductFound;

	const { mutate } = useMutation(
		trpc.nutrition.scanBarcode.mutationOptions({
			onSuccess: (product) => {
				toast.success(`Found: ${product.name}`);
				onFoundRef.current(product);
			},
			onError: (err) => {
				toast.error(err.message ?? "Product not found. Try again.");
				setPhase("error");
			},
		}),
	);

	const mutateRef = useRef(mutate);
	mutateRef.current = mutate;

	// Re-initialise the scanner every time phase flips back to "scanning"
	useEffect(() => {
		if (phase !== "scanning") return;

		const scanner = new Html5QrcodeScanner(
			"reader",
			{
				fps: 10,
				// Wide box suits 1D barcodes better than a square
				qrbox: { width: 280, height: 110 },
				supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
			},
			/* verbose= */ false,
		);

		scanner.render(
			(decodedText: string) => {
				// Guard against duplicate fire on the same frame
				scanner.clear().catch(() => {});
				setPhase("loading");
				mutateRef.current({ barcode: decodedText });
			},
			() => {}, // per-frame decode errors are noise — suppress them
		);

		return () => {
			scanner.clear().catch(() => {});
		};
	}, [phase]);

	return (
		<div className="flex flex-col gap-4">
			{/* Camera feed — only rendered while actively scanning */}
			{phase === "scanning" && (
				<div id="reader" className="w-full overflow-hidden rounded-2xl" />
			)}

			{/* Loading state shown after a successful decode, while the API call runs */}
			{phase === "loading" && (
				<div className="flex h-60 items-center justify-center rounded-2xl border border-border">
					<div className="flex flex-col items-center gap-3 text-muted-foreground">
						<Loader2 className="h-8 w-8 animate-spin" />
						<p className="text-sm">Looking up product…</p>
					</div>
				</div>
			)}

			{/* Error state — lets the user retry without re-opening the sheet */}
			{phase === "error" && (
				<div className="flex h-60 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border">
					<p className="text-sm text-muted-foreground">Product not found.</p>
					<button
						type="button"
						onClick={() => setPhase("scanning")}
						className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background transition-transform active:scale-95"
					>
						Try Again
					</button>
				</div>
			)}

			<button
				type="button"
				onClick={onCancel}
				className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground active:scale-[0.98]"
			>
				<X className="h-4 w-4" />
				Cancel
			</button>
		</div>
	);
}
