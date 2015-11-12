require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"sample_component":[function(require,module,exports){
exports.sample = function(layer, name, layers, params) {};


},{}],"stitch":[function(require,module,exports){
var Parametizer, Scroller, Stitch;

Stitch = (function() {
  Stitch.addComponent = function(component) {
    return _.extend(this.components, component);
  };

  Stitch.components = {
    scroll: function(layer, name, layers, params) {
      var scrollContent, scrollIndicators;
      scrollContent = layers[name + "___scrollContent"];
      scrollIndicators = layers[name + "___scrollIndicators"];
      return new Scroller(layer, _.extend(params, {
        scrollContent: scrollContent,
        scrollIndicators: scrollIndicators
      }));
    }
  };

  function Stitch(layers1) {
    this.layers = layers1;
    this.components = this.constructor.components;
    this.findComponents();
  }

  Stitch.prototype.getParams = function(paramsString) {
    var params;
    return params = (new Parametizer(paramsString)).params;
  };

  Stitch.prototype.findComponents = function() {
    var base, layer, layerName, method, name, params, ref, regEx, result, results;
    regEx = new RegExp("(.+)" + this.defaults.componentTrigger + "([^_]+)(__(.*))*");
    ref = this.layers;
    results = [];
    for (layerName in ref) {
      layer = ref[layerName];
      if (result = layer.name.match(regEx)) {
        name = result[1];
        method = result[2];
        params = this.getParams(result[4]);
        results.push(typeof (base = this.components)[method] === "function" ? base[method](layer, name, this.layers, params) : void 0);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Stitch.prototype.defaults = {
    componentTrigger: '___'
  };

  return Stitch;

})();

Parametizer = (function() {
  function Parametizer(paramsString1, options) {
    this.paramsString = paramsString1;
    if (options == null) {
      options = {};
    }
    this.options = _.extend({}, this.defaults, options);
    this.params = this.objectize(this.paramsString);
    this.params = this.filterParams(this.params);
  }

  Parametizer.prototype.objectize = function(paramsString) {
    var params;
    if (!this.paramsString) {
      return {};
    }
    return params = _.zipObject(paramsString.split('__').map(function(val) {
      return val.split('_');
    }));
  };

  Parametizer.prototype.filterParams = function(params) {
    _.each(this.options.activeFilters, (function(_this) {
      return function(filter) {
        return params = _.reduce(params, function(memo, val, key) {
          memo[key] = _this.filters[filter](val);
          return memo;
        }, {});
      };
    })(this));
    return params;
  };

  Parametizer.prototype.defaults = {
    argumentSeparator: '__',
    keyValueSeparator: '_',
    activeFilters: ['booleans', 'numbers', 'blank']
  };

  Parametizer.prototype.filters = {
    booleans: function(val) {
      if (val === 'true') {
        return true;
      } else if (val === 'false') {
        return false;
      } else {
        return val;
      }
    },
    numbers: function(val) {
      if ((!isNaN(val)) && (val !== false)) {
        return +val;
      } else {
        return val;
      }
    },
    blank: function(val) {
      if (val === void 0) {
        return true;
      } else {
        return val;
      }
    }
  };

  return Parametizer;

})();

Scroller = (function() {
  function Scroller(scrollContainer, options) {
    this.scrollContainer = scrollContainer;
    if (options == null) {
      options = {};
    }
    this.options = _.extend({}, this.defaults, options);
    if (this.options.scrollContent) {
      this.repositionContent();
    }
    this.setScrollerDimensions();
    this.createScroller();
    this.setupScrollDirection();
  }

  Scroller.prototype.defaults = {
    paginated: false,
    scrollContent: null,
    scrollIndicators: null,
    originX: 0.5,
    originY: 0.5,
    inset: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  };

  Scroller.prototype.createScroller = function() {
    if (this.options.paginated) {
      this.scroller = PageComponent.wrap(this.scrollContainer);
      this.scroller.originX = this.options.originX;
      this.scroller.originY = this.options.originY;
      if (this.options.scrollIndicators) {
        this.setupIndicators();
      }
    } else {
      this.scroller = ScrollComponent.wrap(this.scrollContainer);
    }
    this.scroller.content.draggable.directionLock = true;
    this.scroller.contentInset = this.options.inset;
    return this.scrollContainer.scrollComponent = this.scroller;
  };

  Scroller.prototype.setupIndicators = function() {
    var i, indicator, indicatorWrap, j, k, layer, len, len1, offLayer, onLayer, ref, ref1;
    onLayer = this.options.scrollIndicators.subLayersByName('on')[0].copy();
    offLayer = this.options.scrollIndicators.subLayersByName('off')[0].copy();
    ref = this.options.scrollIndicators.subLayers;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      indicator = ref[i];
      indicatorWrap = indicator.copy();
      indicatorWrap.props = {
        name: 'indicator',
        superLayer: indicator.superLayer,
        image: null
      };
      indicator.destroy();
      indicatorWrap.onLayer = onLayer.copy();
      indicatorWrap.offLayer = offLayer.copy();
      ref1 = [indicatorWrap.onLayer, indicatorWrap.offLayer];
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        layer = ref1[i];
        layer.props = {
          opacity: 0,
          x: 0,
          superLayer: indicatorWrap
        };
        layer.states.add({
          on: {
            opacity: 1
          }
        });
      }
    }
    this.updateIndicators();
    return this.scroller.on("change:currentPage", (function(_this) {
      return function() {
        return _this.updateIndicators();
      };
    })(this));
  };

  Scroller.prototype.updateIndicators = function() {
    var i, indicator, j, len, ref, results;
    ref = _.sortBy(this.options.scrollIndicators.subLayers, function(l) {
      return l.x;
    });
    results = [];
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      indicator = ref[i];
      if (i === this.scroller.horizontalPageIndex(this.scroller.currentPage)) {
        indicator.onLayer.states["switch"]('on');
        results.push(indicator.offLayer.states["switch"]('default'));
      } else {
        indicator.onLayer.states["switch"]('default');
        results.push(indicator.offLayer.states["switch"]('on'));
      }
    }
    return results;
  };

  Scroller.prototype.findOffset = function(layer, axis) {
    if (layer.superLayer) {
      return layer[axis] + this.findOffset(layer.superLayer, axis);
    } else {
      return layer[axis];
    }
  };

  Scroller.prototype.setScrollerDimensions = function() {
    this.scrollContainer.width = (function() {
      switch (this.options.width) {
        case 'full':
          return Screen.width;
        case void 0:
          return Math.min(this.scrollContainer.width, Screen.width);
        default:
          return this.options.width;
      }
    }).call(this);
    return this.scrollContainer.height = (function() {
      switch (this.options.height) {
        case 'full':
          return Screen.height;
        case void 0:
          return this.scrollContainer.height;
        default:
          return this.options.height;
      }
    }).call(this);
  };

  Scroller.prototype.setupScrollDirection = function() {
    if (!this.options.hasOwnProperty('scrollHorizontal')) {
      this.options.scrollHorizontal = this.scroller.content.width > this.scroller.width;
    }
    if (!this.options.hasOwnProperty('scrollVertical')) {
      this.options.scrollVertical = this.scroller.content.height > this.scroller.height;
    }
    this.scroller.scrollHorizontal = this.options.scrollHorizontal;
    return this.scroller.scrollVertical = this.options.scrollVertical;
  };

  Scroller.prototype.repositionContent = function() {
    var i, layer, placeholder, placeholderIndex, ref;
    placeholder = this.scrollContainer.subLayersByName('placeholder')[0];
    placeholderIndex = placeholder.index;
    this.options.inset = {
      top: placeholder.y,
      right: placeholder.x,
      bottom: placeholder.y,
      left: placeholder.x
    };
    this.options.scrollContent.props = {
      x: 0,
      y: 0
    };
    if (this.options.scrollContent.subLayers.length > 0) {
      ref = this.options.scrollContent.subLayers;
      for (i in ref) {
        layer = ref[i];
        layer.superLayer = this.scrollContainer;
      }
    } else {
      this.options.scrollContent.superLayer = placeholder.superLayer;
    }
    return placeholder.destroy();
  };

  return Scroller;

})();

exports.Stitch = Stitch;


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbWF0dGovRGVzaWduL1N0aXRjaC9TdGl0Y2gvU3RpdGNoIFBsYXlncm91bmQuZnJhbWVyL21vZHVsZXMvc2FtcGxlX2NvbXBvbmVudC5jb2ZmZWUiLCIvVXNlcnMvbWF0dGovRGVzaWduL1N0aXRjaC9TdGl0Y2gvU3RpdGNoIFBsYXlncm91bmQuZnJhbWVyL21vZHVsZXMvc3RpdGNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1lBLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLFNBQUMsS0FBRCxFQUFRLElBQVIsRUFBYyxNQUFkLEVBQXNCLE1BQXRCLEdBQUE7Ozs7QUNJakIsSUFBQTs7QUFBTTtFQUNKLE1BQUMsQ0FBQSxZQUFELEdBQWUsU0FBQyxTQUFEO1dBQ2IsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsVUFBVixFQUFzQixTQUF0QjtFQURhOztFQUtmLE1BQUMsQ0FBQSxVQUFELEdBQ0U7SUFBQSxNQUFBLEVBQVEsU0FBQyxLQUFELEVBQVEsSUFBUixFQUFjLE1BQWQsRUFBc0IsTUFBdEI7QUFDTixVQUFBO01BQUEsYUFBQSxHQUFnQixNQUFPLENBQUcsSUFBRCxHQUFNLGtCQUFSO01BQ3ZCLGdCQUFBLEdBQW1CLE1BQU8sQ0FBRyxJQUFELEdBQU0scUJBQVI7YUFDdEIsSUFBQSxRQUFBLENBQVMsS0FBVCxFQUFnQixDQUFDLENBQUMsTUFBRixDQUFTLE1BQVQsRUFBaUI7UUFBRSxhQUFBLEVBQWUsYUFBakI7UUFBZ0MsZ0JBQUEsRUFBa0IsZ0JBQWxEO09BQWpCLENBQWhCO0lBSEUsQ0FBUjs7O0VBS1csZ0JBQUMsT0FBRDtJQUFDLElBQUMsQ0FBQSxTQUFEO0lBQ1osSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsV0FBVyxDQUFDO0lBQzNCLElBQUMsQ0FBQSxjQUFELENBQUE7RUFG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MkIsSUFBQyxDQUFBLE9BQU8sQ0FBQztFQVBoQjs7cUJBU3RCLGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsUUFBQTtJQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsZUFBZSxDQUFDLGVBQWpCLENBQWlDLGFBQWpDLENBQWdELENBQUEsQ0FBQTtJQUM5RCxnQkFBQSxHQUFtQixXQUFXLENBQUM7SUFFL0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQ0U7TUFBQSxHQUFBLEVBQUssV0FBVyxDQUFDLENBQWpCO01BQ0EsS0FBQSxFQUFPLFdBQVcsQ0FBQyxDQURuQjtNQUVBLE1BQUEsRUFBUSxXQUFXLENBQUMsQ0FGcEI7TUFHQSxJQUFBLEVBQU0sV0FBVyxDQUFDLENBSGxCOztJQUtGLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQXZCLEdBQStCO01BQUEsQ0FBQSxFQUFHLENBQUg7TUFBTSxDQUFBLEVBQUcsQ0FBVDs7SUFFL0IsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBakMsR0FBMEMsQ0FBN0M7QUFDRTtBQUFBLFdBQUEsUUFBQTs7UUFDRSxLQUFLLENBQUMsVUFBTixHQUFtQixJQUFDLENBQUE7QUFEdEIsT0FERjtLQUFBLE1BQUE7TUFJRSxJQUFDLENBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUF2QixHQUFvQyxXQUFXLENBQUMsV0FKbEQ7O1dBT0EsV0FBVyxDQUFDLE9BQVosQ0FBQTtFQW5CaUI7Ozs7OztBQXNCckIsT0FBTyxDQUFDLE1BQVIsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyBBIHNhbXBsZSBTdGl0Y2ggY29tcG9uZW50IGRlZmluaXRpb24uXG4jIFxuIyBUaGlzIGNvbXBvbmVudCB3b3VsZCBnZXQgY2FsbGVkIG9uIGxheWVycyB3aXRoIHRoZSBrZXl3b3JkICdzYW1wbGUnLlxuIyBcbiMgbGF5ZXIgLSB0aGUgbGF5ZXIgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbXBvbmVudFxuIyBuYW1lIC0gdGhlIHJvb3QgbmFtZSBvZiB0aGUgbGF5ZXIsIHdpdGhvdXQgdGhlIGNvbXBvbmVudCBpbmZvcm1hdGlvblxuIyBsYXllcnMgLSB0aGUgZnVsbCBsaXN0IG9mIGxheWVycyBwYXNzZWQgdG8gdGhlIFN0aXRjaCBpbnN0YW5jZVxuIyBwYXJhbXMgLSBhbiBvYmplY3QgY29uc2lzdGluZyBvZiBhbGwgcGFyYW1ldGVycyBzZXQgYnkgdGhlIGxheWVyXG4jIFxuIyBUbyBsb2FkIHRoaXMgY29tcG9uZW50LCBhZGQgdGhlIGZvbGxvd2luZyB0byB5b3VyIEZyYW1lciBjb2RlOlxuIyAgIFN0aXRjaC5hZGRDb21wb25lbnQgcmVxdWlyZSAnc2FtcGxlX2NvbXBvbmVudCdcbiMgXG5leHBvcnRzLnNhbXBsZSA9IChsYXllciwgbmFtZSwgbGF5ZXJzLCBwYXJhbXMpIC0+XG4gICMgQ3JlYXRlIGF3ZXNvbWUgY29tcG9uZW50IGZ1bmN0aW9uYWxpdHkgaGVyZVxuIiwiIyBUaGUgU3RpdGNoIGNsYXNzIGF1dG9tYWdpY2FsbHkgYXBwbGllcyBmdW5jdGlvbmFsaXR5IHRvIEZyYW1lciBsYXllcnNcbiMgYmFzZWQgb24gdGhlIGxheWVyJ3MgbmFtZS5cbiMgXG4jIEltcG9ydCB0aGUgU3RpdGNoIGNsYXNzIGludG8gZnJhbWVyOlxuIyAgIFN0aXRjaCA9IHJlcXVpcmUoJ3N0aXRjaCcpLlN0aXRjaFxuIyBcbiMgVGhlbiBpbnN0YW50aWF0ZSBTdGl0Y2ggd2l0aCB5b3VyIGxheWVyczpcbiMgICBuZXcgU3RpdGNoIGxheWVyc0ltcG9ydGVkRnJvbVNrZXRjaE9yUGhvdG9zaG9wXG4jIFxuIyBFeGFtcGxlc1xuIyAgIEEgbGF5ZXIgdHJlZSB3LyB0aGUgZm9sbG93aW5nIGxheWVycyB3b3VsZCBjcmVhdGUgYSBwYWdlIGNvbXBvbmVudCB3aXRoIDMgcGFnZXM6XG4jICAgICAtIG1haW5fX19zY3JvbGxfX3BhZ2luYXRlZFxuIyAgICAgICAtIHBhZ2VfYVxuIyAgICAgICAtIHBhZ2VfYlxuIyAgICAgICAtIHBhZ2VfY1xuIyBcbmNsYXNzIFN0aXRjaFxuICBAYWRkQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIF8uZXh0ZW5kIEBjb21wb25lbnRzLCBjb21wb25lbnRcbiAgICBcbiAgIyBBbiBvYmplY3QgdXNlZCB0byBzdG9yZSB0aGUgY29tcG9uZW50cy4gQW55IGxheWVyIHdpdGggXCJfX18je2tleX1cIiBpbiB0aGVcbiAgIyBsYXllciBuYW1lIHdpbGwgYWN0aXZhdGUgdGhlIGNvbXBvbmVudC5cbiAgQGNvbXBvbmVudHM6IFxuICAgIHNjcm9sbDogKGxheWVyLCBuYW1lLCBsYXllcnMsIHBhcmFtcykgLT5cbiAgICAgIHNjcm9sbENvbnRlbnQgPSBsYXllcnNbXCIje25hbWV9X19fc2Nyb2xsQ29udGVudFwiXVxuICAgICAgc2Nyb2xsSW5kaWNhdG9ycyA9IGxheWVyc1tcIiN7bmFtZX1fX19zY3JvbGxJbmRpY2F0b3JzXCJdXG4gICAgICBuZXcgU2Nyb2xsZXIgbGF5ZXIsIF8uZXh0ZW5kKHBhcmFtcywgeyBzY3JvbGxDb250ZW50OiBzY3JvbGxDb250ZW50LCBzY3JvbGxJbmRpY2F0b3JzOiBzY3JvbGxJbmRpY2F0b3JzIH0pXG5cbiAgY29uc3RydWN0b3I6IChAbGF5ZXJzKSAtPlxuICAgIEBjb21wb25lbnRzID0gQGNvbnN0cnVjdG9yLmNvbXBvbmVudHNcbiAgICBAZmluZENvbXBvbmVudHMoKVxuICBcbiAgIyBUYWtlcyB0aGUgcGFyYW1ldGVyIHN0cmluZyBhbmQgc2VwYXJhdGVzIGl0IGludG9cbiAgZ2V0UGFyYW1zOiAocGFyYW1zU3RyaW5nKSAtPlxuICAgIHBhcmFtcyA9IChuZXcgUGFyYW1ldGl6ZXIocGFyYW1zU3RyaW5nKSkucGFyYW1zXG4gIFxuICAjIExvb2tzIHRocm91Z2ggdGhlIGxheWVycyBmb3IgbGF5ZXIgbmFtZXMgdGhhdCBtYXRjaCB3aXRoIHRoZSBrZXlzIGZyb21cbiAgIyB0aGUgY29tcG9uZW50cyBvYmplY3QuXG4gIGZpbmRDb21wb25lbnRzOiAtPlxuICAgIHJlZ0V4ID0gbmV3IFJlZ0V4cCBcIiguKykje0BkZWZhdWx0cy5jb21wb25lbnRUcmlnZ2VyfShbXl9dKykoX18oLiopKSpcIlxuXG4gICAgZm9yIGxheWVyTmFtZSwgbGF5ZXIgb2YgQGxheWVyc1xuICAgICAgaWYgcmVzdWx0ID0gbGF5ZXIubmFtZS5tYXRjaCByZWdFeFxuICAgICAgICBuYW1lID0gcmVzdWx0WzFdXG4gICAgICAgIG1ldGhvZCA9IHJlc3VsdFsyXVxuICAgICAgICBwYXJhbXMgPSBAZ2V0UGFyYW1zIHJlc3VsdFs0XVxuICAgICAgICBAY29tcG9uZW50c1ttZXRob2RdPyhsYXllciwgbmFtZSwgQGxheWVycywgcGFyYW1zKVxuXG4gIGRlZmF1bHRzOlxuICAgIGNvbXBvbmVudFRyaWdnZXI6ICdfX18nXG5cblxuXG4jIEEgY2xhc3MgZm9yIHR1cm5pbmcgYSBzdHJpbmcgaW50byBrZXkvdmFsdWUgcGFpcnMuXG4jIFxuIyBwYXJhbXNTdHJpbmcgLSBBIHN0cmluZyBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIHNlcGFyYXRlZCBieSB0aGUgcHJvcGVyIGFyZ3VtZW50U2VwYXJhdG9ycyBhbmQga2V5VmFsdWVTZXBhcmF0b3JzXG4jIG9wdGlvbnMgLSBBbiBvcHRpb25hbCBvYmplY3QgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG4jICAgICAgICAgICA6YXJndW1lbnRTZXBhcmF0b3IgLSBUaGUgc3RyaW5nIHVzZWQgdG8gc2VwYXJhdGUgdGhlIGtleS92YWx1ZSBwYWlyIGFyZ3VtZW50c1xuIyAgICAgICAgICAgOmtleVZhbHVlU2VwYXJhdG9yIC0gVGhlIHN0cmluZyB1c2VkIHRvIHNlcGFyYXRlIGtleXMgZnJvbSB2YWx1ZXNcbiMgICAgICAgICAgIDphY3RpdmVGaWx0ZXJzIC0gQSBsaXN0IG9mIGZpbHRlcnMgdG8gYmUgYXBwbGllZCB0byB0aGUga2V5L3ZhbHVlIHBhaXJzXG4jIFxuIyBFeGFtcGxlc1xuIyAgKG5ldyBQYXJhbWV0aXplcihcIndpZHRoXzUwX19oZWlnaHRfMTAwX19wYWdpbmF0ZWRcIikpLnBhcmFtcyB3b3VsZCByZXR1cm46XG4jICB7XG4jICAgIHdpZHRoOiA1MCxcbiMgICAgaGVpZ2h0OiAxMDAsXG4jICAgIHBhZ2luYXRlZDogdHJ1ZVxuIyAgfVxuY2xhc3MgUGFyYW1ldGl6ZXJcbiAgY29uc3RydWN0b3I6IChAcGFyYW1zU3RyaW5nLCBvcHRpb25zID0ge30pIC0+XG4gICAgQG9wdGlvbnMgPSBfLmV4dGVuZCB7fSwgQGRlZmF1bHRzLCBvcHRpb25zXG5cbiAgICBAcGFyYW1zID0gQG9iamVjdGl6ZSBAcGFyYW1zU3RyaW5nXG4gICAgQHBhcmFtcyA9IEBmaWx0ZXJQYXJhbXMgQHBhcmFtc1xuICAgIFxuICBvYmplY3RpemU6IChwYXJhbXNTdHJpbmcpIC0+XG4gICAgcmV0dXJuIHt9IHVubGVzcyBAcGFyYW1zU3RyaW5nXG4gICAgXG4gICAgIyBDcmVhdGUgYSBwYXJhbXMgb2JqZWN0IG91dCBvZiBrZXkvdmFsdWUgcGFpcnMgZm91bmQgaW4gdGhlIGxheWVyIG5hbWVcbiAgICBwYXJhbXMgPSBfLnppcE9iamVjdCBwYXJhbXNTdHJpbmcuc3BsaXQoJ19fJykubWFwICh2YWwpIC0+IHZhbC5zcGxpdCgnXycpXG4gICAgXG4gIGZpbHRlclBhcmFtczogKHBhcmFtcykgLT5cbiAgICBfLmVhY2ggQG9wdGlvbnMuYWN0aXZlRmlsdGVycywgKGZpbHRlcikgPT5cbiAgICAgIHBhcmFtcyA9IF8ucmVkdWNlIHBhcmFtcywgKG1lbW8sIHZhbCwga2V5KSA9PlxuICAgICAgICBtZW1vW2tleV0gPSBAZmlsdGVyc1tmaWx0ZXJdKHZhbClcbiAgICAgICAgcmV0dXJuIG1lbW9cbiAgICAgICwge31cbiAgICAgIFxuICAgIHJldHVybiBwYXJhbXNcbiAgICBcbiAgZGVmYXVsdHM6XG4gICAgYXJndW1lbnRTZXBhcmF0b3I6ICdfXycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIHdoYXQgY2hhcmFjdGVyIHNpZ25pZmllcyBhIG5ldyBrZXkvdmFsdWUgYXJndW1lbnQgcGFpclxuICAgIGtleVZhbHVlU2VwYXJhdG9yOiAnXycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyB3aGF0IGNoYXJhY3RlciBzZXBhcmF0ZXMgdGhlIHZhbHVlIGZyb20gdGhlIGtleVxuICAgIGFjdGl2ZUZpbHRlcnM6IFsnYm9vbGVhbnMnLCAnbnVtYmVycycsICdibGFuayddXG4gIFxuICBmaWx0ZXJzOlxuICAgIGJvb2xlYW5zOiAodmFsKSAtPlxuICAgICAgaWYgdmFsIGlzICd0cnVlJ1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgZWxzZSBpZiB2YWwgaXMgJ2ZhbHNlJ1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHZhbFxuICAgIG51bWJlcnM6ICh2YWwpIC0+XG4gICAgICBpZiAobm90IGlzTmFOIHZhbCkgYW5kICh2YWwgIT0gZmFsc2UpXG4gICAgICAgIHJldHVybiArdmFsXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB2YWxcbiAgICBibGFuazogKHZhbCkgLT5cbiAgICAgIGlmIHZhbCBpcyB1bmRlZmluZWRcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHZhbFxuXG5cbiMgQSBjbGFzcyBmb3IgbWFraW5nIGEgbGF5ZXIgc2Nyb2xsYWJsZS5cbmNsYXNzIFNjcm9sbGVyXG4gIGNvbnN0cnVjdG9yOiAoQHNjcm9sbENvbnRhaW5lciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIEBvcHRpb25zID0gXy5leHRlbmQge30sIEBkZWZhdWx0cywgb3B0aW9ucyAgICBcbiAgICBcbiAgICBpZiBAb3B0aW9ucy5zY3JvbGxDb250ZW50XG4gICAgICBAcmVwb3NpdGlvbkNvbnRlbnQoKVxuXG4gICAgQHNldFNjcm9sbGVyRGltZW5zaW9ucygpXG4gICAgQGNyZWF0ZVNjcm9sbGVyKClcbiAgICBAc2V0dXBTY3JvbGxEaXJlY3Rpb24oKVxuICBcbiAgZGVmYXVsdHM6XG4gICAgcGFnaW5hdGVkOiBmYWxzZVxuICAgIHNjcm9sbENvbnRlbnQ6IG51bGxcbiAgICBzY3JvbGxJbmRpY2F0b3JzOiBudWxsXG4gICAgb3JpZ2luWDogMC41XG4gICAgb3JpZ2luWTogMC41XG4gICAgaW5zZXQ6XG4gICAgICB0b3A6IDBcbiAgICAgIHJpZ2h0OiAwXG4gICAgICBib3R0b206IDBcbiAgICAgIGxlZnQ6IDBcbiAgXG4gICMgQ3JlYXRlcyB0aGUgc2Nyb2xsQ29tcG9uZW50IG9yIHBhZ2VDb21wb25lbnQsIGFuZCBtYWtlcyBpdCBhY2Nlc3NpYmxlXG4gICMgb24gdGhlIGxheWVyIGl0c2VsZiBhcyBsYXllci5zY3JvbGxDb21wb25lbnRcbiAgY3JlYXRlU2Nyb2xsZXI6IC0+XG4gICAgaWYgQG9wdGlvbnMucGFnaW5hdGVkXG4gICAgICBAc2Nyb2xsZXIgPSBQYWdlQ29tcG9uZW50LndyYXAgQHNjcm9sbENvbnRhaW5lclxuICAgICAgQHNjcm9sbGVyLm9yaWdpblggPSBAb3B0aW9ucy5vcmlnaW5YXG4gICAgICBAc2Nyb2xsZXIub3JpZ2luWSA9IEBvcHRpb25zLm9yaWdpbllcbiAgICAgIEBzZXR1cEluZGljYXRvcnMoKSBpZiBAb3B0aW9ucy5zY3JvbGxJbmRpY2F0b3JzXG4gICAgZWxzZVxuICAgICAgQHNjcm9sbGVyID0gU2Nyb2xsQ29tcG9uZW50LndyYXAgQHNjcm9sbENvbnRhaW5lclxuXG4gICAgQHNjcm9sbGVyLmNvbnRlbnQuZHJhZ2dhYmxlLmRpcmVjdGlvbkxvY2sgPSB0cnVlXG4gICAgQHNjcm9sbGVyLmNvbnRlbnRJbnNldCA9IEBvcHRpb25zLmluc2V0XG5cbiAgICBAc2Nyb2xsQ29udGFpbmVyLnNjcm9sbENvbXBvbmVudCA9IEBzY3JvbGxlclxuXG4gICMgU2V0dXAgdGhlIHByb3BlciBsYXllcnMgYW5kIGxheWVyIHN0YXRlcyBmb3IgdHVybmluZyBvbiBhbmQgb2ZmIHBhZ2luYXRpb24gaW5kaWNhdG9yc1xuICBzZXR1cEluZGljYXRvcnM6IC0+XG4gICAgb25MYXllciA9IEBvcHRpb25zLnNjcm9sbEluZGljYXRvcnMuc3ViTGF5ZXJzQnlOYW1lKCdvbicpWzBdLmNvcHkoKVxuICAgIG9mZkxheWVyID0gQG9wdGlvbnMuc2Nyb2xsSW5kaWNhdG9ycy5zdWJMYXllcnNCeU5hbWUoJ29mZicpWzBdLmNvcHkoKVxuXG4gICAgIyBDcmVhdGUgbGF5ZXJzIHRoYXQgY29udGFpbiBib3RoIHRoZSBvbiBhbmQgb2ZmIGluZGljYXRvcnNcbiAgICBmb3IgaW5kaWNhdG9yLCBpIGluIEBvcHRpb25zLnNjcm9sbEluZGljYXRvcnMuc3ViTGF5ZXJzXG4gICAgICBpbmRpY2F0b3JXcmFwID0gaW5kaWNhdG9yLmNvcHkoKVxuICAgICAgaW5kaWNhdG9yV3JhcC5wcm9wcyA9IG5hbWU6ICdpbmRpY2F0b3InLCBzdXBlckxheWVyOiBpbmRpY2F0b3Iuc3VwZXJMYXllciwgaW1hZ2U6IG51bGxcbiAgICAgIGluZGljYXRvci5kZXN0cm95KClcblxuICAgICAgaW5kaWNhdG9yV3JhcC5vbkxheWVyID0gb25MYXllci5jb3B5KClcbiAgICAgIGluZGljYXRvcldyYXAub2ZmTGF5ZXIgPSBvZmZMYXllci5jb3B5KClcblxuICAgICAgZm9yIGxheWVyLCBpIGluIFtpbmRpY2F0b3JXcmFwLm9uTGF5ZXIsIGluZGljYXRvcldyYXAub2ZmTGF5ZXJdXG4gICAgICAgIGxheWVyLnByb3BzID0gb3BhY2l0eTogMCwgeDogMCwgc3VwZXJMYXllcjogaW5kaWNhdG9yV3JhcFxuICAgICAgICBsYXllci5zdGF0ZXMuYWRkIG9uOiBvcGFjaXR5OiAxXG5cbiAgICBAdXBkYXRlSW5kaWNhdG9ycygpXG4gICAgQHNjcm9sbGVyLm9uIFwiY2hhbmdlOmN1cnJlbnRQYWdlXCIsID0+XG4gICAgICBAdXBkYXRlSW5kaWNhdG9ycygpXG5cbiAgdXBkYXRlSW5kaWNhdG9yczogLT5cbiAgICBmb3IgaW5kaWNhdG9yLCBpIGluIF8uc29ydEJ5KEBvcHRpb25zLnNjcm9sbEluZGljYXRvcnMuc3ViTGF5ZXJzLCAobCkgLT4gbC54KVxuICAgICAgaWYgaSBpcyBAc2Nyb2xsZXIuaG9yaXpvbnRhbFBhZ2VJbmRleCBAc2Nyb2xsZXIuY3VycmVudFBhZ2VcbiAgICAgICAgaW5kaWNhdG9yLm9uTGF5ZXIuc3RhdGVzLnN3aXRjaCAnb24nXG4gICAgICAgIGluZGljYXRvci5vZmZMYXllci5zdGF0ZXMuc3dpdGNoICdkZWZhdWx0J1xuICAgICAgZWxzZVxuICAgICAgICBpbmRpY2F0b3Iub25MYXllci5zdGF0ZXMuc3dpdGNoICdkZWZhdWx0J1xuICAgICAgICBpbmRpY2F0b3Iub2ZmTGF5ZXIuc3RhdGVzLnN3aXRjaCAnb24nXG5cbiAgIyBDYWxjdWxhdGVzIHRoZSBvZmZzZXQgb2YgbGF5ZXIgcmVsYXRpdmUgdG8gdGhlIHNjcmVlblxuICBmaW5kT2Zmc2V0OiAobGF5ZXIsIGF4aXMpIC0+XG4gICAgaWYgbGF5ZXIuc3VwZXJMYXllclxuICAgICAgcmV0dXJuIGxheWVyW2F4aXNdICsgQGZpbmRPZmZzZXQobGF5ZXIuc3VwZXJMYXllciwgYXhpcylcbiAgICBlbHNlXG4gICAgICByZXR1cm4gbGF5ZXJbYXhpc11cblxuXG4gIHNldFNjcm9sbGVyRGltZW5zaW9uczogLT5cbiAgICBAc2Nyb2xsQ29udGFpbmVyLndpZHRoID0gc3dpdGNoIEBvcHRpb25zLndpZHRoXG4gICAgICB3aGVuICdmdWxsJyB0aGVuIFNjcmVlbi53aWR0aFxuICAgICAgd2hlbiB1bmRlZmluZWQgdGhlbiBNYXRoLm1pbiBAc2Nyb2xsQ29udGFpbmVyLndpZHRoLCBTY3JlZW4ud2lkdGhcbiAgICAgIGVsc2UgQG9wdGlvbnMud2lkdGhcbiAgICBAc2Nyb2xsQ29udGFpbmVyLmhlaWdodCA9IHN3aXRjaCBAb3B0aW9ucy5oZWlnaHRcbiAgICAgIHdoZW4gJ2Z1bGwnIHRoZW4gU2NyZWVuLmhlaWdodFxuICAgICAgd2hlbiB1bmRlZmluZWQgdGhlbiBAc2Nyb2xsQ29udGFpbmVyLmhlaWdodFxuICAgICAgZWxzZSBAb3B0aW9ucy5oZWlnaHRcbiAgICAgIFxuICBzZXR1cFNjcm9sbERpcmVjdGlvbjogLT5cbiAgICB1bmxlc3MgQG9wdGlvbnMuaGFzT3duUHJvcGVydHkgJ3Njcm9sbEhvcml6b250YWwnXG4gICAgICBAb3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsID0gQHNjcm9sbGVyLmNvbnRlbnQud2lkdGggPiBAc2Nyb2xsZXIud2lkdGhcbiAgICB1bmxlc3MgQG9wdGlvbnMuaGFzT3duUHJvcGVydHkgJ3Njcm9sbFZlcnRpY2FsJ1xuICAgICAgQG9wdGlvbnMuc2Nyb2xsVmVydGljYWwgPSBAc2Nyb2xsZXIuY29udGVudC5oZWlnaHQgPiBAc2Nyb2xsZXIuaGVpZ2h0XG5cbiAgICBAc2Nyb2xsZXIuc2Nyb2xsSG9yaXpvbnRhbCA9IEBvcHRpb25zLnNjcm9sbEhvcml6b250YWxcbiAgICBAc2Nyb2xsZXIuc2Nyb2xsVmVydGljYWwgPSBAb3B0aW9ucy5zY3JvbGxWZXJ0aWNhbFxuXG4gIHJlcG9zaXRpb25Db250ZW50OiAtPlxuICAgIHBsYWNlaG9sZGVyID0gQHNjcm9sbENvbnRhaW5lci5zdWJMYXllcnNCeU5hbWUoJ3BsYWNlaG9sZGVyJylbMF1cbiAgICBwbGFjZWhvbGRlckluZGV4ID0gcGxhY2Vob2xkZXIuaW5kZXhcblxuICAgIEBvcHRpb25zLmluc2V0ID1cbiAgICAgIHRvcDogcGxhY2Vob2xkZXIueVxuICAgICAgcmlnaHQ6IHBsYWNlaG9sZGVyLnhcbiAgICAgIGJvdHRvbTogcGxhY2Vob2xkZXIueVxuICAgICAgbGVmdDogcGxhY2Vob2xkZXIueFxuXG4gICAgQG9wdGlvbnMuc2Nyb2xsQ29udGVudC5wcm9wcyA9IHg6IDAsIHk6IDBcblxuICAgIGlmIEBvcHRpb25zLnNjcm9sbENvbnRlbnQuc3ViTGF5ZXJzLmxlbmd0aCA+IDBcbiAgICAgIGZvciBpLCBsYXllciBvZiBAb3B0aW9ucy5zY3JvbGxDb250ZW50LnN1YkxheWVyc1xuICAgICAgICBsYXllci5zdXBlckxheWVyID0gQHNjcm9sbENvbnRhaW5lclxuICAgIGVsc2VcbiAgICAgIEBvcHRpb25zLnNjcm9sbENvbnRlbnQuc3VwZXJMYXllciA9IHBsYWNlaG9sZGVyLnN1cGVyTGF5ZXJcblxuICAgICMgQG9wdGlvbnMuc2Nyb2xsQ29udGVudC5pbmRleCA9IHBsYWNlaG9sZGVySW5kZXhcbiAgICBwbGFjZWhvbGRlci5kZXN0cm95KClcblxuXG5leHBvcnRzLlN0aXRjaCA9IFN0aXRjaFxuIl19
