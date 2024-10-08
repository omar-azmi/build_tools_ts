/** this submodule only contains the exported type definitions provided by the cli scripts for formatting the optional config file.
 * see {@link CliConfigJson} for details.
 * 
 * @module
*/

import type { CliConfigJson as DistCliConfigJson } from "./dist.ts"
import type { CliConfigJson as DocsCliConfigJson } from "./docs.ts"
import type { CliConfigJson as NpmCliConfigJson } from "./npm.ts"


/** the combined json schema definition for this package's configurable cli json configuration files, provided with the `--config` witch. */
export interface CliConfigJson extends DistCliConfigJson, DocsCliConfigJson, NpmCliConfigJson { }
