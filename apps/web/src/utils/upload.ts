import { createClient } from "@supabase/supabase-js";

import { env } from "@fitness-app/env/web";

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

export async function uploadExerciseImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("exercises")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("exercises").getPublicUrl(path);
  return data.publicUrl;
}
