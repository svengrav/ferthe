# Tech Konzept

```
candidates = localPOIs
  .filter(distance < 800m)
  .filter(notVisited)
  .filter(score > threshold)

spot = random(candidates)
```

- Stumble: Create will allow to provide users with a wide range of points of interest (POIs) to discover and explore.