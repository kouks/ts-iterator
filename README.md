# ts-iterator

why iterators?

- O(n) instead of O(n \* m) where m is the number of operations on array
- aka. doing .filter .fitler .filter .map is just semantic and doesn't affect the performance
- better interface with more utils
- endless iterators
- benchmarks

caveats

- no borrow checker so you could mess this up by editing the values weirdly

TODO: coverage
TODO: semantic release
