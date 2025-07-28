Extension classes of Map and Set that do not have size limits.

They actually extend `Map` and `Set` so `instanceof` works and they function in exactly the same way Map and Set do*.

install:
```
npm install bigbigmapset
```

use:
```
import {BigMap, BigSet} from "bigbigmapset"
let m = new BigMap();
let s = new BigSet();
```

This implementation is also runtime independent. Different javascript runtimes have different size limits on `Map` and `Set` but it doesn't matter what those specific size limits are. They could vary within the same runtime and this implementation would still work.

---

*As of July 7 2025. If new methods are added to `Map` and `Set` and this package has not been updated, they will be inherited by `BigMap` and `BigSet` but most likely not work, acting as though the `BigMap` or `BigSet` was simply empty (most likely failure mode).