# House Design Platform API v1

## Base URL

```
https://api.housedgn.com/api
```

---

# 1. Home

GET /houses?home=true

---

# 2. House List

GET /houses?page=1&limit=15

Optional

type=1-story
type=2-story
type=3-story
type=4-story
type=luxury
type=tinshade

---

# 3. House Details

GET /houses/:id

---

# 4. Related Houses

GET /houses/related/:id

---

# 5. Search

GET /houses/search?q=modern