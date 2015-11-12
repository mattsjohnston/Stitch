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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbWF0dGovRGVzaWduL1N0aXRjaC9zdGl0Y2gtc2FtcGxlLmZyYW1lci9tb2R1bGVzL3NhbXBsZV9jb21wb25lbnQuY29mZmVlIiwiL1VzZXJzL21hdHRqL0Rlc2lnbi9TdGl0Y2gvc3RpdGNoLXNhbXBsZS5mcmFtZXIvbW9kdWxlcy9zdGl0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDWUEsT0FBTyxDQUFDLE1BQVIsR0FBaUIsU0FBQyxLQUFELEVBQVEsSUFBUixFQUFjLE1BQWQsRUFBc0IsTUFBdEIsR0FBQTs7OztBQ0lqQixJQUFBOztBQUFNO0VBQ0osTUFBQyxDQUFBLFlBQUQsR0FBZSxTQUFDLFNBQUQ7V0FDYixDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxVQUFWLEVBQXNCLFNBQXRCO0VBRGE7O0VBS2YsTUFBQyxDQUFBLFVBQUQsR0FDRTtJQUFBLE1BQUEsRUFBUSxTQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQixNQUF0QjtBQUNOLFVBQUE7TUFBQSxhQUFBLEdBQWdCLE1BQU8sQ0FBRyxJQUFELEdBQU0sa0JBQVI7TUFDdkIsZ0JBQUEsR0FBbUIsTUFBTyxDQUFHLElBQUQsR0FBTSxxQkFBUjthQUN0QixJQUFBLFFBQUEsQ0FBUyxLQUFULEVBQWdCLENBQUMsQ0FBQyxNQUFGLENBQVMsTUFBVCxFQUFpQjtRQUFFLGFBQUEsRUFBZSxhQUFqQjtRQUFnQyxnQkFBQSxFQUFrQixnQkFBbEQ7T0FBakIsQ0FBaEI7SUFIRSxDQUFSOzs7RUFLVyxnQkFBQyxPQUFEO0lBQUMsSUFBQyxDQUFBLFNBQUQ7SUFDWixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxXQUFXLENBQUM7SUFDM0IsSUFBQyxDQUFBLGNBQUQsQ0FBQTtFQUZXOzttQkFLYixTQUFBLEdBQVcsU0FB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O0VBUGhCOztxQkFTdEIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixRQUFBO0lBQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxlQUFlLENBQUMsZUFBakIsQ0FBaUMsYUFBakMsQ0FBZ0QsQ0FBQSxDQUFBO0lBQzlELGdCQUFBLEdBQW1CLFdBQVcsQ0FBQztJQUUvQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FDRTtNQUFBLEdBQUEsRUFBSyxXQUFXLENBQUMsQ0FBakI7TUFDQSxLQUFBLEVBQU8sV0FBVyxDQUFDLENBRG5CO01BRUEsTUFBQSxFQUFRLFdBQVcsQ0FBQyxDQUZwQjtNQUdBLElBQUEsRUFBTSxXQUFXLENBQUMsQ0FIbEI7O0lBS0YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBdkIsR0FBK0I7TUFBQSxDQUFBLEVBQUcsQ0FBSDtNQUFNLENBQUEsRUFBRyxDQUFUOztJQUUvQixJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFqQyxHQUEwQyxDQUE3QztBQUNFO0FBQUEsV0FBQSxRQUFBOztRQUNFLEtBQUssQ0FBQyxVQUFOLEdBQW1CLElBQUMsQ0FBQTtBQUR0QixPQURGO0tBQUEsTUFBQTtNQUlFLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQXZCLEdBQW9DLFdBQVcsQ0FBQyxXQUpsRDs7V0FPQSxXQUFXLENBQUMsT0FBWixDQUFBO0VBbkJpQjs7Ozs7O0FBc0JyQixPQUFPLENBQUMsTUFBUixHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIEEgc2FtcGxlIFN0aXRjaCBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiMgXG4jIFRoaXMgY29tcG9uZW50IHdvdWxkIGdldCBjYWxsZWQgb24gbGF5ZXJzIHdpdGggdGhlIGtleXdvcmQgJ3NhbXBsZScuXG4jIFxuIyBsYXllciAtIHRoZSBsYXllciB0aGF0IHRyaWdnZXJlZCB0aGUgY29tcG9uZW50XG4jIG5hbWUgLSB0aGUgcm9vdCBuYW1lIG9mIHRoZSBsYXllciwgd2l0aG91dCB0aGUgY29tcG9uZW50IGluZm9ybWF0aW9uXG4jIGxheWVycyAtIHRoZSBmdWxsIGxpc3Qgb2YgbGF5ZXJzIHBhc3NlZCB0byB0aGUgU3RpdGNoIGluc3RhbmNlXG4jIHBhcmFtcyAtIGFuIG9iamVjdCBjb25zaXN0aW5nIG9mIGFsbCBwYXJhbWV0ZXJzIHNldCBieSB0aGUgbGF5ZXJcbiMgXG4jIFRvIGxvYWQgdGhpcyBjb21wb25lbnQsIGFkZCB0aGUgZm9sbG93aW5nIHRvIHlvdXIgRnJhbWVyIGNvZGU6XG4jICAgU3RpdGNoLmFkZENvbXBvbmVudCByZXF1aXJlICdzYW1wbGVfY29tcG9uZW50J1xuIyBcbmV4cG9ydHMuc2FtcGxlID0gKGxheWVyLCBuYW1lLCBsYXllcnMsIHBhcmFtcykgLT5cbiAgIyBDcmVhdGUgYXdlc29tZSBjb21wb25lbnQgZnVuY3Rpb25hbGl0eSBoZXJlXG4iLCIjIFRoZSBTdGl0Y2ggY2xhc3MgYXV0b21hZ2ljYWxseSBhcHBsaWVzIGZ1bmN0aW9uYWxpdHkgdG8gRnJhbWVyIGxheWVyc1xuIyBiYXNlZCBvbiB0aGUgbGF5ZXIncyBuYW1lLlxuIyBcbiMgSW1wb3J0IHRoZSBTdGl0Y2ggY2xhc3MgaW50byBmcmFtZXI6XG4jICAgU3RpdGNoID0gcmVxdWlyZSgnc3RpdGNoJykuU3RpdGNoXG4jIFxuIyBUaGVuIGluc3RhbnRpYXRlIFN0aXRjaCB3aXRoIHlvdXIgbGF5ZXJzOlxuIyAgIG5ldyBTdGl0Y2ggbGF5ZXJzSW1wb3J0ZWRGcm9tU2tldGNoT3JQaG90b3Nob3BcbiMgXG4jIEV4YW1wbGVzXG4jICAgQSBsYXllciB0cmVlIHcvIHRoZSBmb2xsb3dpbmcgbGF5ZXJzIHdvdWxkIGNyZWF0ZSBhIHBhZ2UgY29tcG9uZW50IHdpdGggMyBwYWdlczpcbiMgICAgIC0gbWFpbl9fX3Njcm9sbF9fcGFnaW5hdGVkXG4jICAgICAgIC0gcGFnZV9hXG4jICAgICAgIC0gcGFnZV9iXG4jICAgICAgIC0gcGFnZV9jXG4jIFxuY2xhc3MgU3RpdGNoXG4gIEBhZGRDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgXy5leHRlbmQgQGNvbXBvbmVudHMsIGNvbXBvbmVudFxuICAgIFxuICAjIEFuIG9iamVjdCB1c2VkIHRvIHN0b3JlIHRoZSBjb21wb25lbnRzLiBBbnkgbGF5ZXIgd2l0aCBcIl9fXyN7a2V5fVwiIGluIHRoZVxuICAjIGxheWVyIG5hbWUgd2lsbCBhY3RpdmF0ZSB0aGUgY29tcG9uZW50LlxuICBAY29tcG9uZW50czogXG4gICAgc2Nyb2xsOiAobGF5ZXIsIG5hbWUsIGxheWVycywgcGFyYW1zKSAtPlxuICAgICAgc2Nyb2xsQ29udGVudCA9IGxheWVyc1tcIiN7bmFtZX1fX19zY3JvbGxDb250ZW50XCJdXG4gICAgICBzY3JvbGxJbmRpY2F0b3JzID0gbGF5ZXJzW1wiI3tuYW1lfV9fX3Njcm9sbEluZGljYXRvcnNcIl1cbiAgICAgIG5ldyBTY3JvbGxlciBsYXllciwgXy5leHRlbmQocGFyYW1zLCB7IHNjcm9sbENvbnRlbnQ6IHNjcm9sbENvbnRlbnQsIHNjcm9sbEluZGljYXRvcnM6IHNjcm9sbEluZGljYXRvcnMgfSlcblxuICBjb25zdHJ1Y3RvcjogKEBsYXllcnMpIC0+XG4gICAgQGNvbXBvbmVudHMgPSBAY29uc3RydWN0b3IuY29tcG9uZW50c1xuICAgIEBmaW5kQ29tcG9uZW50cygpXG4gIFxuICAjIFRha2VzIHRoZSBwYXJhbWV0ZXIgc3RyaW5nIGFuZCBzZXBhcmF0ZXMgaXQgaW50b1xuICBnZXRQYXJhbXM6IChwYXJhbXNTdHJpbmcpIC0+XG4gICAgcGFyYW1zID0gKG5ldyBQYXJhbWV0aXplcihwYXJhbXNTdHJpbmcpKS5wYXJhbXNcbiAgXG4gICMgTG9va3MgdGhyb3VnaCB0aGUgbGF5ZXJzIGZvciBsYXllciBuYW1lcyB0aGF0IG1hdGNoIHdpdGggdGhlIGtleXMgZnJvbVxuICAjIHRoZSBjb21wb25lbnRzIG9iamVjdC5cbiAgZmluZENvbXBvbmVudHM6IC0+XG4gICAgcmVnRXggPSBuZXcgUmVnRXhwIFwiKC4rKSN7QGRlZmF1bHRzLmNvbXBvbmVudFRyaWdnZXJ9KFteX10rKShfXyguKikpKlwiXG5cbiAgICBmb3IgbGF5ZXJOYW1lLCBsYXllciBvZiBAbGF5ZXJzXG4gICAgICBpZiByZXN1bHQgPSBsYXllci5uYW1lLm1hdGNoIHJlZ0V4XG4gICAgICAgIG5hbWUgPSByZXN1bHRbMV1cbiAgICAgICAgbWV0aG9kID0gcmVzdWx0WzJdXG4gICAgICAgIHBhcmFtcyA9IEBnZXRQYXJhbXMgcmVzdWx0WzRdXG4gICAgICAgIEBjb21wb25lbnRzW21ldGhvZF0/KGxheWVyLCBuYW1lLCBAbGF5ZXJzLCBwYXJhbXMpXG5cbiAgZGVmYXVsdHM6XG4gICAgY29tcG9uZW50VHJpZ2dlcjogJ19fXydcblxuXG5cbiMgQSBjbGFzcyBmb3IgdHVybmluZyBhIHN0cmluZyBpbnRvIGtleS92YWx1ZSBwYWlycy5cbiMgXG4jIHBhcmFtc1N0cmluZyAtIEEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgc2VwYXJhdGVkIGJ5IHRoZSBwcm9wZXIgYXJndW1lbnRTZXBhcmF0b3JzIGFuZCBrZXlWYWx1ZVNlcGFyYXRvcnNcbiMgb3B0aW9ucyAtIEFuIG9wdGlvbmFsIG9iamVjdCB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcbiMgICAgICAgICAgIDphcmd1bWVudFNlcGFyYXRvciAtIFRoZSBzdHJpbmcgdXNlZCB0byBzZXBhcmF0ZSB0aGUga2V5L3ZhbHVlIHBhaXIgYXJndW1lbnRzXG4jICAgICAgICAgICA6a2V5VmFsdWVTZXBhcmF0b3IgLSBUaGUgc3RyaW5nIHVzZWQgdG8gc2VwYXJhdGUga2V5cyBmcm9tIHZhbHVlc1xuIyAgICAgICAgICAgOmFjdGl2ZUZpbHRlcnMgLSBBIGxpc3Qgb2YgZmlsdGVycyB0byBiZSBhcHBsaWVkIHRvIHRoZSBrZXkvdmFsdWUgcGFpcnNcbiMgXG4jIEV4YW1wbGVzXG4jICAobmV3IFBhcmFtZXRpemVyKFwid2lkdGhfNTBfX2hlaWdodF8xMDBfX3BhZ2luYXRlZFwiKSkucGFyYW1zIHdvdWxkIHJldHVybjpcbiMgIHtcbiMgICAgd2lkdGg6IDUwLFxuIyAgICBoZWlnaHQ6IDEwMCxcbiMgICAgcGFnaW5hdGVkOiB0cnVlXG4jICB9XG5jbGFzcyBQYXJhbWV0aXplclxuICBjb25zdHJ1Y3RvcjogKEBwYXJhbXNTdHJpbmcsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBAb3B0aW9ucyA9IF8uZXh0ZW5kIHt9LCBAZGVmYXVsdHMsIG9wdGlvbnNcblxuICAgIEBwYXJhbXMgPSBAb2JqZWN0aXplIEBwYXJhbXNTdHJpbmdcbiAgICBAcGFyYW1zID0gQGZpbHRlclBhcmFtcyBAcGFyYW1zXG4gICAgXG4gIG9iamVjdGl6ZTogKHBhcmFtc1N0cmluZykgLT5cbiAgICByZXR1cm4ge30gdW5sZXNzIEBwYXJhbXNTdHJpbmdcbiAgICBcbiAgICAjIENyZWF0ZSBhIHBhcmFtcyBvYmplY3Qgb3V0IG9mIGtleS92YWx1ZSBwYWlycyBmb3VuZCBpbiB0aGUgbGF5ZXIgbmFtZVxuICAgIHBhcmFtcyA9IF8uemlwT2JqZWN0IHBhcmFtc1N0cmluZy5zcGxpdCgnX18nKS5tYXAgKHZhbCkgLT4gdmFsLnNwbGl0KCdfJylcbiAgICBcbiAgZmlsdGVyUGFyYW1zOiAocGFyYW1zKSAtPlxuICAgIF8uZWFjaCBAb3B0aW9ucy5hY3RpdmVGaWx0ZXJzLCAoZmlsdGVyKSA9PlxuICAgICAgcGFyYW1zID0gXy5yZWR1Y2UgcGFyYW1zLCAobWVtbywgdmFsLCBrZXkpID0+XG4gICAgICAgIG1lbW9ba2V5XSA9IEBmaWx0ZXJzW2ZpbHRlcl0odmFsKVxuICAgICAgICByZXR1cm4gbWVtb1xuICAgICAgLCB7fVxuICAgICAgXG4gICAgcmV0dXJuIHBhcmFtc1xuICAgIFxuICBkZWZhdWx0czpcbiAgICBhcmd1bWVudFNlcGFyYXRvcjogJ19fJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgd2hhdCBjaGFyYWN0ZXIgc2lnbmlmaWVzIGEgbmV3IGtleS92YWx1ZSBhcmd1bWVudCBwYWlyXG4gICAga2V5VmFsdWVTZXBhcmF0b3I6ICdfJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIHdoYXQgY2hhcmFjdGVyIHNlcGFyYXRlcyB0aGUgdmFsdWUgZnJvbSB0aGUga2V5XG4gICAgYWN0aXZlRmlsdGVyczogWydib29sZWFucycsICdudW1iZXJzJywgJ2JsYW5rJ11cbiAgXG4gIGZpbHRlcnM6XG4gICAgYm9vbGVhbnM6ICh2YWwpIC0+XG4gICAgICBpZiB2YWwgaXMgJ3RydWUnXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICBlbHNlIGlmIHZhbCBpcyAnZmFsc2UnXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gdmFsXG4gICAgbnVtYmVyczogKHZhbCkgLT5cbiAgICAgIGlmIChub3QgaXNOYU4gdmFsKSBhbmQgKHZhbCAhPSBmYWxzZSlcbiAgICAgICAgcmV0dXJuICt2YWxcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHZhbFxuICAgIGJsYW5rOiAodmFsKSAtPlxuICAgICAgaWYgdmFsIGlzIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gdmFsXG5cblxuIyBBIGNsYXNzIGZvciBtYWtpbmcgYSBsYXllciBzY3JvbGxhYmxlLlxuY2xhc3MgU2Nyb2xsZXJcbiAgY29uc3RydWN0b3I6IChAc2Nyb2xsQ29udGFpbmVyLCBvcHRpb25zID0ge30pIC0+XG4gICAgQG9wdGlvbnMgPSBfLmV4dGVuZCB7fSwgQGRlZmF1bHRzLCBvcHRpb25zICAgIFxuICAgIFxuICAgIGlmIEBvcHRpb25zLnNjcm9sbENvbnRlbnRcbiAgICAgIEByZXBvc2l0aW9uQ29udGVudCgpXG5cbiAgICBAc2V0U2Nyb2xsZXJEaW1lbnNpb25zKClcbiAgICBAY3JlYXRlU2Nyb2xsZXIoKVxuICAgIEBzZXR1cFNjcm9sbERpcmVjdGlvbigpXG4gIFxuICBkZWZhdWx0czpcbiAgICBwYWdpbmF0ZWQ6IGZhbHNlXG4gICAgc2Nyb2xsQ29udGVudDogbnVsbFxuICAgIHNjcm9sbEluZGljYXRvcnM6IG51bGxcbiAgICBvcmlnaW5YOiAwLjVcbiAgICBvcmlnaW5ZOiAwLjVcbiAgICBpbnNldDpcbiAgICAgIHRvcDogMFxuICAgICAgcmlnaHQ6IDBcbiAgICAgIGJvdHRvbTogMFxuICAgICAgbGVmdDogMFxuICBcbiAgIyBDcmVhdGVzIHRoZSBzY3JvbGxDb21wb25lbnQgb3IgcGFnZUNvbXBvbmVudCwgYW5kIG1ha2VzIGl0IGFjY2Vzc2libGVcbiAgIyBvbiB0aGUgbGF5ZXIgaXRzZWxmIGFzIGxheWVyLnNjcm9sbENvbXBvbmVudFxuICBjcmVhdGVTY3JvbGxlcjogLT5cbiAgICBpZiBAb3B0aW9ucy5wYWdpbmF0ZWRcbiAgICAgIEBzY3JvbGxlciA9IFBhZ2VDb21wb25lbnQud3JhcCBAc2Nyb2xsQ29udGFpbmVyXG4gICAgICBAc2Nyb2xsZXIub3JpZ2luWCA9IEBvcHRpb25zLm9yaWdpblhcbiAgICAgIEBzY3JvbGxlci5vcmlnaW5ZID0gQG9wdGlvbnMub3JpZ2luWVxuICAgICAgQHNldHVwSW5kaWNhdG9ycygpIGlmIEBvcHRpb25zLnNjcm9sbEluZGljYXRvcnNcbiAgICBlbHNlXG4gICAgICBAc2Nyb2xsZXIgPSBTY3JvbGxDb21wb25lbnQud3JhcCBAc2Nyb2xsQ29udGFpbmVyXG5cbiAgICBAc2Nyb2xsZXIuY29udGVudC5kcmFnZ2FibGUuZGlyZWN0aW9uTG9jayA9IHRydWVcbiAgICBAc2Nyb2xsZXIuY29udGVudEluc2V0ID0gQG9wdGlvbnMuaW5zZXRcblxuICAgIEBzY3JvbGxDb250YWluZXIuc2Nyb2xsQ29tcG9uZW50ID0gQHNjcm9sbGVyXG5cbiAgIyBTZXR1cCB0aGUgcHJvcGVyIGxheWVycyBhbmQgbGF5ZXIgc3RhdGVzIGZvciB0dXJuaW5nIG9uIGFuZCBvZmYgcGFnaW5hdGlvbiBpbmRpY2F0b3JzXG4gIHNldHVwSW5kaWNhdG9yczogLT5cbiAgICBvbkxheWVyID0gQG9wdGlvbnMuc2Nyb2xsSW5kaWNhdG9ycy5zdWJMYXllcnNCeU5hbWUoJ29uJylbMF0uY29weSgpXG4gICAgb2ZmTGF5ZXIgPSBAb3B0aW9ucy5zY3JvbGxJbmRpY2F0b3JzLnN1YkxheWVyc0J5TmFtZSgnb2ZmJylbMF0uY29weSgpXG5cbiAgICAjIENyZWF0ZSBsYXllcnMgdGhhdCBjb250YWluIGJvdGggdGhlIG9uIGFuZCBvZmYgaW5kaWNhdG9yc1xuICAgIGZvciBpbmRpY2F0b3IsIGkgaW4gQG9wdGlvbnMuc2Nyb2xsSW5kaWNhdG9ycy5zdWJMYXllcnNcbiAgICAgIGluZGljYXRvcldyYXAgPSBpbmRpY2F0b3IuY29weSgpXG4gICAgICBpbmRpY2F0b3JXcmFwLnByb3BzID0gbmFtZTogJ2luZGljYXRvcicsIHN1cGVyTGF5ZXI6IGluZGljYXRvci5zdXBlckxheWVyLCBpbWFnZTogbnVsbFxuICAgICAgaW5kaWNhdG9yLmRlc3Ryb3koKVxuXG4gICAgICBpbmRpY2F0b3JXcmFwLm9uTGF5ZXIgPSBvbkxheWVyLmNvcHkoKVxuICAgICAgaW5kaWNhdG9yV3JhcC5vZmZMYXllciA9IG9mZkxheWVyLmNvcHkoKVxuXG4gICAgICBmb3IgbGF5ZXIsIGkgaW4gW2luZGljYXRvcldyYXAub25MYXllciwgaW5kaWNhdG9yV3JhcC5vZmZMYXllcl1cbiAgICAgICAgbGF5ZXIucHJvcHMgPSBvcGFjaXR5OiAwLCB4OiAwLCBzdXBlckxheWVyOiBpbmRpY2F0b3JXcmFwXG4gICAgICAgIGxheWVyLnN0YXRlcy5hZGQgb246IG9wYWNpdHk6IDFcblxuICAgIEB1cGRhdGVJbmRpY2F0b3JzKClcbiAgICBAc2Nyb2xsZXIub24gXCJjaGFuZ2U6Y3VycmVudFBhZ2VcIiwgPT5cbiAgICAgIEB1cGRhdGVJbmRpY2F0b3JzKClcblxuICB1cGRhdGVJbmRpY2F0b3JzOiAtPlxuICAgIGZvciBpbmRpY2F0b3IsIGkgaW4gXy5zb3J0QnkoQG9wdGlvbnMuc2Nyb2xsSW5kaWNhdG9ycy5zdWJMYXllcnMsIChsKSAtPiBsLngpXG4gICAgICBpZiBpIGlzIEBzY3JvbGxlci5ob3Jpem9udGFsUGFnZUluZGV4IEBzY3JvbGxlci5jdXJyZW50UGFnZVxuICAgICAgICBpbmRpY2F0b3Iub25MYXllci5zdGF0ZXMuc3dpdGNoICdvbidcbiAgICAgICAgaW5kaWNhdG9yLm9mZkxheWVyLnN0YXRlcy5zd2l0Y2ggJ2RlZmF1bHQnXG4gICAgICBlbHNlXG4gICAgICAgIGluZGljYXRvci5vbkxheWVyLnN0YXRlcy5zd2l0Y2ggJ2RlZmF1bHQnXG4gICAgICAgIGluZGljYXRvci5vZmZMYXllci5zdGF0ZXMuc3dpdGNoICdvbidcblxuICAjIENhbGN1bGF0ZXMgdGhlIG9mZnNldCBvZiBsYXllciByZWxhdGl2ZSB0byB0aGUgc2NyZWVuXG4gIGZpbmRPZmZzZXQ6IChsYXllciwgYXhpcykgLT5cbiAgICBpZiBsYXllci5zdXBlckxheWVyXG4gICAgICByZXR1cm4gbGF5ZXJbYXhpc10gKyBAZmluZE9mZnNldChsYXllci5zdXBlckxheWVyLCBheGlzKVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBsYXllcltheGlzXVxuXG5cbiAgc2V0U2Nyb2xsZXJEaW1lbnNpb25zOiAtPlxuICAgIEBzY3JvbGxDb250YWluZXIud2lkdGggPSBzd2l0Y2ggQG9wdGlvbnMud2lkdGhcbiAgICAgIHdoZW4gJ2Z1bGwnIHRoZW4gU2NyZWVuLndpZHRoXG4gICAgICB3aGVuIHVuZGVmaW5lZCB0aGVuIE1hdGgubWluIEBzY3JvbGxDb250YWluZXIud2lkdGgsIFNjcmVlbi53aWR0aFxuICAgICAgZWxzZSBAb3B0aW9ucy53aWR0aFxuICAgIEBzY3JvbGxDb250YWluZXIuaGVpZ2h0ID0gc3dpdGNoIEBvcHRpb25zLmhlaWdodFxuICAgICAgd2hlbiAnZnVsbCcgdGhlbiBTY3JlZW4uaGVpZ2h0XG4gICAgICB3aGVuIHVuZGVmaW5lZCB0aGVuIEBzY3JvbGxDb250YWluZXIuaGVpZ2h0XG4gICAgICBlbHNlIEBvcHRpb25zLmhlaWdodFxuICAgICAgXG4gIHNldHVwU2Nyb2xsRGlyZWN0aW9uOiAtPlxuICAgIHVubGVzcyBAb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSAnc2Nyb2xsSG9yaXpvbnRhbCdcbiAgICAgIEBvcHRpb25zLnNjcm9sbEhvcml6b250YWwgPSBAc2Nyb2xsZXIuY29udGVudC53aWR0aCA+IEBzY3JvbGxlci53aWR0aFxuICAgIHVubGVzcyBAb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSAnc2Nyb2xsVmVydGljYWwnXG4gICAgICBAb3B0aW9ucy5zY3JvbGxWZXJ0aWNhbCA9IEBzY3JvbGxlci5jb250ZW50LmhlaWdodCA+IEBzY3JvbGxlci5oZWlnaHRcblxuICAgIEBzY3JvbGxlci5zY3JvbGxIb3Jpem9udGFsID0gQG9wdGlvbnMuc2Nyb2xsSG9yaXpvbnRhbFxuICAgIEBzY3JvbGxlci5zY3JvbGxWZXJ0aWNhbCA9IEBvcHRpb25zLnNjcm9sbFZlcnRpY2FsXG5cbiAgcmVwb3NpdGlvbkNvbnRlbnQ6IC0+XG4gICAgcGxhY2Vob2xkZXIgPSBAc2Nyb2xsQ29udGFpbmVyLnN1YkxheWVyc0J5TmFtZSgncGxhY2Vob2xkZXInKVswXVxuICAgIHBsYWNlaG9sZGVySW5kZXggPSBwbGFjZWhvbGRlci5pbmRleFxuXG4gICAgQG9wdGlvbnMuaW5zZXQgPVxuICAgICAgdG9wOiBwbGFjZWhvbGRlci55XG4gICAgICByaWdodDogcGxhY2Vob2xkZXIueFxuICAgICAgYm90dG9tOiBwbGFjZWhvbGRlci55XG4gICAgICBsZWZ0OiBwbGFjZWhvbGRlci54XG5cbiAgICBAb3B0aW9ucy5zY3JvbGxDb250ZW50LnByb3BzID0geDogMCwgeTogMFxuXG4gICAgaWYgQG9wdGlvbnMuc2Nyb2xsQ29udGVudC5zdWJMYXllcnMubGVuZ3RoID4gMFxuICAgICAgZm9yIGksIGxheWVyIG9mIEBvcHRpb25zLnNjcm9sbENvbnRlbnQuc3ViTGF5ZXJzXG4gICAgICAgIGxheWVyLnN1cGVyTGF5ZXIgPSBAc2Nyb2xsQ29udGFpbmVyXG4gICAgZWxzZVxuICAgICAgQG9wdGlvbnMuc2Nyb2xsQ29udGVudC5zdXBlckxheWVyID0gcGxhY2Vob2xkZXIuc3VwZXJMYXllclxuXG4gICAgIyBAb3B0aW9ucy5zY3JvbGxDb250ZW50LmluZGV4ID0gcGxhY2Vob2xkZXJJbmRleFxuICAgIHBsYWNlaG9sZGVyLmRlc3Ryb3koKVxuXG5cbmV4cG9ydHMuU3RpdGNoID0gU3RpdGNoXG4iXX0=
