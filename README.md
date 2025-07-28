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

*As of July 7 2025. If new methods are added to `Map` and `Set` and this package has not been updated, they will be inherited by `BigMap` and `BigSet` but most likely not work, acting as though the `BigMap` or `BigSet` was simply empty (most likely failure mode).