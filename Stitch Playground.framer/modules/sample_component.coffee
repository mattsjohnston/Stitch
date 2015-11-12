# A sample Stitch component definition.
# 
# This component would get called on layers with the keyword 'sample'.
# 
# layer - the layer that triggered the component
# name - the root name of the layer, without the component information
# layers - the full list of layers passed to the Stitch instance
# params - an object consisting of all parameters set by the layer
# 
# To load this component, add the following to your Framer code:
#   Stitch.addComponent require 'sample_component'
# 
exports.sample = (layer, name, layers, params) ->
  # Create awesome component functionality here
