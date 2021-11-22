This action generates index of your TreeStickies repository as README.md.

## Inputs

## `index-file-name`

The name of generated index file. Default is `"README.md"`.

## Usage 1: Generate README.md

uses: actions/tree-stickies-create-index-action@v1.0

## Usage 2: Generate index.md

uses: actions/tree-stickies-create-index-action@v1.0
with:
  index-file-name: 'index.md'
