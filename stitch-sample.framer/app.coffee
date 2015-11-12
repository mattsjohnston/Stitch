# This imports all the layers for "Stitch Sample" into sketchLayers
sketchLayers = Framer.Importer.load "imported/Stitch Sample"

Stitch = require('stitch').Stitch

new Stitch sketchLayers
