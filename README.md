# Stitch 1.0.0-beta

Stitch is a lightweight framework for adding interaction to your Framer prototypes directly from your Sketch designs.

Use the built-in components (currently only `scroll`), or build your own on top of Stitch and share them with the community!

This is an early beta - feedback welcome. 

## Demo
Download the sample Framer prototype with its associated .sketch file from this repo. You can play with the sample prototype [here](http://share.framerjs.com/tfj7tzovbbwn/).

[![Stitch Sample](/Stitch Sample.png)](http://share.framerjs.com/tfj7tzovbbwn/)

## Usage

### Adding Stitch to your Prototype
Add `stitch.coffee` to the modules directory of your Framer prototype.

Import Stitch:
```Coffeescript
Stitch = require('stitch').Stitch
```

Instantiate Stitch on your Sketch/Photoshop layers:
```Coffeescript
new Stitch layers
```

### Triggering Stitch Components
Triggering Stitch components is done through the naming of your folders in Sketch.

```
layerName___componentName__arg1_arg1Value__arg2_arg2Value...
```

So, in order to make one of your folders scrollable, all you have to do is add `___scroll` to your layer name:

```
mainLayer___scroll
```

If your mainLayer is taller or wider than the prototype device, Stitch will automatically add scrolling functionality within the bounds of the device.

If you want explicitly set the height of the scrollable container, you can do so with arguments:

```
mainLayer___scroll__height_200
```

If you want to pass a parameter with the boolean value `true`, either include true as the value, or leave the value out:

```
mainLayer___scroll__pagination
```
This would instantiate the scroll component with the parameters object `{ pagination: true }`

## Adding Components
At the most basic level, a component consists simply of a trigger word and a function.

For example, let's create a new component for making toggles. Create a new file in your prototype's modules directory called `stitch.toggle.coffee`.

At the bare minimum, this file needs to export your component:

```Coffeescript
exports.toggle = (layer, name, layers, params) ->
  # do your magic here
```

Let's first pretend you have a folder in your Sketch document named `myToggle___toggle__start_on`.

When your component is called by Stitch, it will pass a series of arguments:

#### layer
This is the layer that triggered the component, or in our case, `myToggle___toggle__start_on`.

#### name
This is the root name of the layer, without the component triggers, or in our case, `myToggle`.

#### layers
This contains all the layers that were passed to the Stitch instance. In most cases this would refer to your entire Sketch document.

#### params
This is an object of all the parameters set by the folder name in Sketch. In our case, this would return:
```
{
  start: on
}
```

## Components

### Scroll
Use the [Stitch Sample](/Stitch Sample.sketch) Sketch file as a guide. More documentation to come.
