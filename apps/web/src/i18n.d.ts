// Augment i18next's type system so every t() call is key-checked at compile time
import "i18next";

import type enCommon from "./locales/en/common.json";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "common";
		resources: {
			common: typeof enCommon;
		};
	}
}
