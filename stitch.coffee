# The Stitch class automagically applies functionality to Framer layers
# based on the layer's name.
# 
# Import the Stitch class into framer:
#   Stitch = require('stitch').Stitch
# 
# Then instantiate Stitch with your layers:
#   new Stitch layersImportedFromSketchOrPhotoshop
# 
# Examples
#   A layer tree w/ the following layers would create a page component with 3 pages:
#     - main___scroll__paginated
#       - page_a
#       - page_b
#       - page_c
# 
class Stitch
  @addComponent: (component) ->
    _.extend @components, component
    
  # An object used to store the components. Any layer with "___#{key}" in the
  # layer name will activate the component.
  @components: 
    scroll: (layer, name, layers, params) ->
      scrollContent = layers["#{name}___scrollContent"]
      scrollIndicators = layers["#{name}___scrollIndicators"]
      new Scroller layer, _.extend(params, { scrollContent: scrollContent, scrollIndicators: scrollIndicators })

  constructor: (@layers) ->
    @components = @constructor.components
    @findComponents()
  
  # Takes the parameter string and separates it into
  getParams: (paramsString) ->
    params = (new Parametizer(paramsString)).params
  
  # Looks through the layers for layer names that match with the keys from
  # the components object.
  findComponents: ->
    regEx = new RegExp "(.+)#{@defaults.componentTrigger}([^_]+)(__(.*))*"

    for layerName, layer of @layers
      if result = layer.name.match regEx
        name = result[1]
        method = result[2]
        params = @getParams result[4]
        @components[method]?(layer, name, @layers, params)

  defaults:
    componentTrigger: '___'



# A class for turning a string into key/value pairs.
# 
# paramsString - A string containing the parameters separated by the proper argumentSeparators and keyValueSeparators
# options - An optional object to override the defaults
#           :argumentSeparator - The string used to separate the key/value pair arguments
#           :keyValueSeparator - The string used to separate keys from values
#           :activeFilters - A list of filters to be applied to the key/value pairs
# 
# Examples
#  (new Parametizer("width_50__height_100__paginated")).params would return:
#  {
#    width: 50,
#    height: 100,
#    paginated: true
#  }
class Parametizer
  constructor: (@paramsString, options = {}) ->
    @options = _.extend {}, @defaults, options

    @params = @objectize @paramsString
    @params = @filterParams @params
    
  objectize: (paramsString) ->
    return {} unless @paramsString
    
    # Create a params object out of key/value pairs found in the layer name
    params = _.zipObject paramsString.split('__').map (val) -> val.split('_')
    
  filterParams: (params) ->
    _.each @options.activeFilters, (filter) =>
      params = _.reduce params, (memo, val, key) =>
        memo[key] = @filters[filter](val)
        return memo
      , {}
      
    return params
    
  defaults:
    argumentSeparator: '__'                              # what character signifies a new key/value argument pair
    keyValueSeparator: '_'                               # what character separates the value from the key
    activeFilters: ['booleans', 'numbers', 'blank']
  
  filters:
    booleans: (val) ->
      if val is 'true'
        return true
      else if val is 'false'
        return false
      else
        return val
    numbers: (val) ->
      if (not isNaN val) and (val != false)
        return +val
      else
        return val
    blank: (val) ->
      if val is undefined
        return true
      else
        return val


# A class for making a layer scrollable.
class Scroller
  constructor: (@scrollContainer, options = {}) ->
    @options = _.extend {}, @defaults, options    
    
    if @options.scrollContent
      @repositionContent()

    @setScrollerDimensions()
    @createScroller()
    @setupScrollDirection()
  
  defaults:
    paginated: false
    scrollContent: null
    scrollIndicators: null
    originX: 0.5
    originY: 0.5
    inset:
      top: 0
      right: 0
      bottom: 0
      left: 0
  
  # Creates the scrollComponent or pageComponent, and makes it accessible
  # on the layer itself as layer.scrollComponent
  createScroller: ->
    if @options.paginated
      @scroller = PageComponent.wrap @scrollContainer
      @scroller.originX = @options.originX
      @scroller.originY = @options.originY
      @setupIndicators() if @options.scrollIndicators
    else
      @scroller = ScrollComponent.wrap @scrollContainer

    @scroller.content.draggable.directionLock = true
    @scroller.contentInset = @options.inset

    @scrollContainer.scrollComponent = @scroller

  # Setup the proper layers and layer states for turning on and off pagination indicators
  setupIndicators: ->
    onLayer = @options.scrollIndicators.subLayersByName('on')[0].copy()
    offLayer = @options.scrollIndicators.subLayersByName('off')[0].copy()

    # Create layers that contain both the on and off indicators
    for indicator, i in @options.scrollIndicators.subLayers
      indicatorWrap = indicator.copy()
      indicatorWrap.props = name: 'indicator', superLayer: indicator.superLayer, image: null
      indicator.destroy()

      indicatorWrap.onLayer = onLayer.copy()
      indicatorWrap.offLayer = offLayer.copy()

      for layer, i in [indicatorWrap.onLayer, indicatorWrap.offLayer]
        layer.props = opacity: 0, x: 0, superLayer: indicatorWrap
        layer.states.add on: opacity: 1

    @updateIndicators()
    @scroller.on "change:currentPage", =>
      @updateIndicators()

  updateIndicators: ->
    for indicator, i in _.sortBy(@options.scrollIndicators.subLayers, (l) -> l.x)
      if i is @scroller.horizontalPageIndex @scroller.currentPage
        indicator.onLayer.states.switch 'on'
        indicator.offLayer.states.switch 'default'
      else
        indicator.onLayer.states.switch 'default'
        indicator.offLayer.states.switch 'on'

  # Calculates the offset of layer relative to the screen
  findOffset: (layer, axis) ->
    if layer.superLayer
      return layer[axis] + @findOffset(layer.superLayer, axis)
    else
      return layer[axis]


  setScrollerDimensions: ->
    @scrollContainer.width = switch @options.width
      when 'full' then Screen.width
      when undefined then Math.min @scrollContainer.width, Screen.width
      else @options.width
    @scrollContainer.height = switch @options.height
      when 'full' then Screen.height
      when undefined then @scrollContainer.height
      else @options.height
      
  setupScrollDirection: ->
    unless @options.hasOwnProperty 'scrollHorizontal'
      @options.scrollHorizontal = @scroller.content.width > @scroller.width
    unless @options.hasOwnProperty 'scrollVertical'
      @options.scrollVertical = @scroller.content.height > @scroller.height

    @scroller.scrollHorizontal = @options.scrollHorizontal
    @scroller.scrollVertical = @options.scrollVertical

  repositionContent: ->
    placeholder = @scrollContainer.subLayersByName('placeholder')[0]
    placeholderIndex = placeholder.index

    @options.inset =
      top: placeholder.y
      right: placeholder.x
      bottom: placeholder.y
      left: placeholder.x

    @options.scrollContent.props = x: 0, y: 0

    if @options.scrollContent.subLayers.length > 0
      for i, layer of @options.scrollContent.subLayers
        layer.superLayer = @scrollContainer
    else
      @options.scrollContent.superLayer = placeholder.superLayer

    # @options.scrollContent.index = placeholderIndex
    placeholder.destroy()


exports.Stitch = Stitch
