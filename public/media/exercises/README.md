# Exercise form-guide media

Start (`0.jpg`) and end (`1.jpg`) positions for each exercise, from
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), released into
the public domain under the [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE).

Folders are named with the dataset's exercise IDs and keep its file layout, so
`src/data/formGuideMedia.js` can resolve any ID. To add an exercise, download
`exercises/<id>/0.jpg` and `1.jpg` from the dataset into `<id>/` here, then
add an entry with `media: '<id>'` to `src/data/formGuides.js`.
