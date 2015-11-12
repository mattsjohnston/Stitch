# This imports all the layers for "Stitch Sample" into sketchLayers
sketchLayers = Framer.Importer.load "imported/Stitch Playground"

Stitch = require('stitch').Stitch

new Stitch sketchLayers
