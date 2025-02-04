# Validate CSS URL

Example:

```yaml
name: Validate CSS URLs

on:
  deployment:
    types: [created]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate CSS URLs
        uses: ./
        env:
          URL: ${{ secrets.URL }}
```
