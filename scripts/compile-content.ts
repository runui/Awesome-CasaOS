import { writeCompiledContent } from './content';

const catalogs = writeCompiledContent();
console.log(`Compiled ${catalogs.en.stores.length} stores for ${Object.keys(catalogs).join(', ')} from base JSON and locale overrides.`);
