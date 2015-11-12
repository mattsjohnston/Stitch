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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbWF0dGovRGVzaWduL1N0aXRjaC9TdGl0Y2gvc3RpdGNoLXNhbXBsZS5mcmFtZXIvbW9kdWxlcy9zYW1wbGVfY29tcG9uZW50LmNvZmZlZSIsIi9Vc2Vycy9tYXR0ai9EZXNpZ24vU3RpdGNoL1N0aXRjaC9zdGl0Y2gtc2FtcGxlLmZyYW1lci9tb2R1bGVzL3N0aXRjaC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNZQSxPQUFPLENBQUMsTUFBUixHQUFpQixTQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQixNQUF0QixHQUFBOzs7O0FDSWpCLElBQUE7O0FBQU07RUFDSixNQUFDLENBQUEsWUFBRCxHQUFlLFNBQUMsU0FBRDtXQUNiLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBQyxDQUFBLFVBQVYsRUFBc0IsU0FBdEI7RUFEYTs7RUFLZixNQUFDLENBQUEsVUFBRCxHQUNFO0lBQUEsTUFBQSxFQUFRLFNBQUMsS0FBRCxFQUFRLElBQVIsRUFBYyxNQUFkLEVBQXNCLE1BQXRCO0FBQ04sVUFBQTtNQUFBLGFBQUEsR0FBZ0IsTUFBTyxDQUFHLElBQUQsR0FBTSxrQkFBUjtNQUN2QixnQkFBQSxHQUFtQixNQUFPLENBQUcsSUFBRCxHQUFNLHFCQUFSO2FBQ3RCLElBQUEsUUFBQSxDQUFTLEtBQVQsRUFBZ0IsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxNQUFULEVBQWlCO1FBQUUsYUFBQSxFQUFlLGFBQWpCO1FBQWdDLGdCQUFBLEVBQWtCLGdCQUFsRDtPQUFqQixDQUFoQjtJQUhFLENBQVI7OztFQUtXLGdCQUFDLE9BQUQ7SUFBQyxJQUFDLENBQUEsU0FBRDtJQUNaLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLFdBQVcsQ0FBQztJQUMzQixJQUFDLENBQUEsY0FBRCxDQUFBO0VBRlc7O21CQUti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Q0FBQSxPQUFPLENBQUM7RUFQaEI7O3FCQVN0QixpQkFBQSxHQUFtQixTQUFBO0FBQ2pCLFFBQUE7SUFBQSxXQUFBLEdBQWMsSUFBQyxDQUFBLGVBQWUsQ0FBQyxlQUFqQixDQUFpQyxhQUFqQyxDQUFnRCxDQUFBLENBQUE7SUFDOUQsZ0JBQUEsR0FBbUIsV0FBVyxDQUFDO0lBRS9CLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUNFO01BQUEsR0FBQSxFQUFLLFdBQVcsQ0FBQyxDQUFqQjtNQUNBLEtBQUEsRUFBTyxXQUFXLENBQUMsQ0FEbkI7TUFFQSxNQUFBLEVBQVEsV0FBVyxDQUFDLENBRnBCO01BR0EsSUFBQSxFQUFNLFdBQVcsQ0FBQyxDQUhsQjs7SUFLRixJQUFDLENBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUF2QixHQUErQjtNQUFBLENBQUEsRUFBRyxDQUFIO01BQU0sQ0FBQSxFQUFHLENBQVQ7O0lBRS9CLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQWpDLEdBQTBDLENBQTdDO0FBQ0U7QUFBQSxXQUFBLFFBQUE7O1FBQ0UsS0FBSyxDQUFDLFVBQU4sR0FBbUIsSUFBQyxDQUFBO0FBRHRCLE9BREY7S0FBQSxNQUFBO01BSUUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFhLENBQUMsVUFBdkIsR0FBb0MsV0FBVyxDQUFDLFdBSmxEOztXQU9BLFdBQVcsQ0FBQyxPQUFaLENBQUE7RUFuQmlCOzs7Ozs7QUFzQnJCLE9BQU8sQ0FBQyxNQUFSLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMgQSBzYW1wbGUgU3RpdGNoIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuIyBcbiMgVGhpcyBjb21wb25lbnQgd291bGQgZ2V0IGNhbGxlZCBvbiBsYXllcnMgd2l0aCB0aGUga2V5d29yZCAnc2FtcGxlJy5cbiMgXG4jIGxheWVyIC0gdGhlIGxheWVyIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb21wb25lbnRcbiMgbmFtZSAtIHRoZSByb290IG5hbWUgb2YgdGhlIGxheWVyLCB3aXRob3V0IHRoZSBjb21wb25lbnQgaW5mb3JtYXRpb25cbiMgbGF5ZXJzIC0gdGhlIGZ1bGwgbGlzdCBvZiBsYXllcnMgcGFzc2VkIHRvIHRoZSBTdGl0Y2ggaW5zdGFuY2VcbiMgcGFyYW1zIC0gYW4gb2JqZWN0IGNvbnNpc3Rpbmcgb2YgYWxsIHBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBsYXllclxuIyBcbiMgVG8gbG9hZCB0aGlzIGNvbXBvbmVudCwgYWRkIHRoZSBmb2xsb3dpbmcgdG8geW91ciBGcmFtZXIgY29kZTpcbiMgICBTdGl0Y2guYWRkQ29tcG9uZW50IHJlcXVpcmUgJ3NhbXBsZV9jb21wb25lbnQnXG4jIFxuZXhwb3J0cy5zYW1wbGUgPSAobGF5ZXIsIG5hbWUsIGxheWVycywgcGFyYW1zKSAtPlxuICAjIENyZWF0ZSBhd2Vzb21lIGNvbXBvbmVudCBmdW5jdGlvbmFsaXR5IGhlcmVcbiIsIiMgVGhlIFN0aXRjaCBjbGFzcyBhdXRvbWFnaWNhbGx5IGFwcGxpZXMgZnVuY3Rpb25hbGl0eSB0byBGcmFtZXIgbGF5ZXJzXG4jIGJhc2VkIG9uIHRoZSBsYXllcidzIG5hbWUuXG4jIFxuIyBJbXBvcnQgdGhlIFN0aXRjaCBjbGFzcyBpbnRvIGZyYW1lcjpcbiMgICBTdGl0Y2ggPSByZXF1aXJlKCdzdGl0Y2gnKS5TdGl0Y2hcbiMgXG4jIFRoZW4gaW5zdGFudGlhdGUgU3RpdGNoIHdpdGggeW91ciBsYXllcnM6XG4jICAgbmV3IFN0aXRjaCBsYXllcnNJbXBvcnRlZEZyb21Ta2V0Y2hPclBob3Rvc2hvcFxuIyBcbiMgRXhhbXBsZXNcbiMgICBBIGxheWVyIHRyZWUgdy8gdGhlIGZvbGxvd2luZyBsYXllcnMgd291bGQgY3JlYXRlIGEgcGFnZSBjb21wb25lbnQgd2l0aCAzIHBhZ2VzOlxuIyAgICAgLSBtYWluX19fc2Nyb2xsX19wYWdpbmF0ZWRcbiMgICAgICAgLSBwYWdlX2FcbiMgICAgICAgLSBwYWdlX2JcbiMgICAgICAgLSBwYWdlX2NcbiMgXG5jbGFzcyBTdGl0Y2hcbiAgQGFkZENvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBfLmV4dGVuZCBAY29tcG9uZW50cywgY29tcG9uZW50XG4gICAgXG4gICMgQW4gb2JqZWN0IHVzZWQgdG8gc3RvcmUgdGhlIGNvbXBvbmVudHMuIEFueSBsYXllciB3aXRoIFwiX19fI3trZXl9XCIgaW4gdGhlXG4gICMgbGF5ZXIgbmFtZSB3aWxsIGFjdGl2YXRlIHRoZSBjb21wb25lbnQuXG4gIEBjb21wb25lbnRzOiBcbiAgICBzY3JvbGw6IChsYXllciwgbmFtZSwgbGF5ZXJzLCBwYXJhbXMpIC0+XG4gICAgICBzY3JvbGxDb250ZW50ID0gbGF5ZXJzW1wiI3tuYW1lfV9fX3Njcm9sbENvbnRlbnRcIl1cbiAgICAgIHNjcm9sbEluZGljYXRvcnMgPSBsYXllcnNbXCIje25hbWV9X19fc2Nyb2xsSW5kaWNhdG9yc1wiXVxuICAgICAgbmV3IFNjcm9sbGVyIGxheWVyLCBfLmV4dGVuZChwYXJhbXMsIHsgc2Nyb2xsQ29udGVudDogc2Nyb2xsQ29udGVudCwgc2Nyb2xsSW5kaWNhdG9yczogc2Nyb2xsSW5kaWNhdG9ycyB9KVxuXG4gIGNvbnN0cnVjdG9yOiAoQGxheWVycykgLT5cbiAgICBAY29tcG9uZW50cyA9IEBjb25zdHJ1Y3Rvci5jb21wb25lbnRzXG4gICAgQGZpbmRDb21wb25lbnRzKClcbiAgXG4gICMgVGFrZXMgdGhlIHBhcmFtZXRlciBzdHJpbmcgYW5kIHNlcGFyYXRlcyBpdCBpbnRvXG4gIGdldFBhcmFtczogKHBhcmFtc1N0cmluZykgLT5cbiAgICBwYXJhbXMgPSAobmV3IFBhcmFtZXRpemVyKHBhcmFtc1N0cmluZykpLnBhcmFtc1xuICBcbiAgIyBMb29rcyB0aHJvdWdoIHRoZSBsYXllcnMgZm9yIGxheWVyIG5hbWVzIHRoYXQgbWF0Y2ggd2l0aCB0aGUga2V5cyBmcm9tXG4gICMgdGhlIGNvbXBvbmVudHMgb2JqZWN0LlxuICBmaW5kQ29tcG9uZW50czogLT5cbiAgICByZWdFeCA9IG5ldyBSZWdFeHAgXCIoLispI3tAZGVmYXVsdHMuY29tcG9uZW50VHJpZ2dlcn0oW15fXSspKF9fKC4qKSkqXCJcblxuICAgIGZvciBsYXllck5hbWUsIGxheWVyIG9mIEBsYXllcnNcbiAgICAgIGlmIHJlc3VsdCA9IGxheWVyLm5hbWUubWF0Y2ggcmVnRXhcbiAgICAgICAgbmFtZSA9IHJlc3VsdFsxXVxuICAgICAgICBtZXRob2QgPSByZXN1bHRbMl1cbiAgICAgICAgcGFyYW1zID0gQGdldFBhcmFtcyByZXN1bHRbNF1cbiAgICAgICAgQGNvbXBvbmVudHNbbWV0aG9kXT8obGF5ZXIsIG5hbWUsIEBsYXllcnMsIHBhcmFtcylcblxuICBkZWZhdWx0czpcbiAgICBjb21wb25lbnRUcmlnZ2VyOiAnX19fJ1xuXG5cblxuIyBBIGNsYXNzIGZvciB0dXJuaW5nIGEgc3RyaW5nIGludG8ga2V5L3ZhbHVlIHBhaXJzLlxuIyBcbiMgcGFyYW1zU3RyaW5nIC0gQSBzdHJpbmcgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBzZXBhcmF0ZWQgYnkgdGhlIHByb3BlciBhcmd1bWVudFNlcGFyYXRvcnMgYW5kIGtleVZhbHVlU2VwYXJhdG9yc1xuIyBvcHRpb25zIC0gQW4gb3B0aW9uYWwgb2JqZWN0IHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuIyAgICAgICAgICAgOmFyZ3VtZW50U2VwYXJhdG9yIC0gVGhlIHN0cmluZyB1c2VkIHRvIHNlcGFyYXRlIHRoZSBrZXkvdmFsdWUgcGFpciBhcmd1bWVudHNcbiMgICAgICAgICAgIDprZXlWYWx1ZVNlcGFyYXRvciAtIFRoZSBzdHJpbmcgdXNlZCB0byBzZXBhcmF0ZSBrZXlzIGZyb20gdmFsdWVzXG4jICAgICAgICAgICA6YWN0aXZlRmlsdGVycyAtIEEgbGlzdCBvZiBmaWx0ZXJzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGtleS92YWx1ZSBwYWlyc1xuIyBcbiMgRXhhbXBsZXNcbiMgIChuZXcgUGFyYW1ldGl6ZXIoXCJ3aWR0aF81MF9faGVpZ2h0XzEwMF9fcGFnaW5hdGVkXCIpKS5wYXJhbXMgd291bGQgcmV0dXJuOlxuIyAge1xuIyAgICB3aWR0aDogNTAsXG4jICAgIGhlaWdodDogMTAwLFxuIyAgICBwYWdpbmF0ZWQ6IHRydWVcbiMgIH1cbmNsYXNzIFBhcmFtZXRpemVyXG4gIGNvbnN0cnVjdG9yOiAoQHBhcmFtc1N0cmluZywgb3B0aW9ucyA9IHt9KSAtPlxuICAgIEBvcHRpb25zID0gXy5leHRlbmQge30sIEBkZWZhdWx0cywgb3B0aW9uc1xuXG4gICAgQHBhcmFtcyA9IEBvYmplY3RpemUgQHBhcmFtc1N0cmluZ1xuICAgIEBwYXJhbXMgPSBAZmlsdGVyUGFyYW1zIEBwYXJhbXNcbiAgICBcbiAgb2JqZWN0aXplOiAocGFyYW1zU3RyaW5nKSAtPlxuICAgIHJldHVybiB7fSB1bmxlc3MgQHBhcmFtc1N0cmluZ1xuICAgIFxuICAgICMgQ3JlYXRlIGEgcGFyYW1zIG9iamVjdCBvdXQgb2Yga2V5L3ZhbHVlIHBhaXJzIGZvdW5kIGluIHRoZSBsYXllciBuYW1lXG4gICAgcGFyYW1zID0gXy56aXBPYmplY3QgcGFyYW1zU3RyaW5nLnNwbGl0KCdfXycpLm1hcCAodmFsKSAtPiB2YWwuc3BsaXQoJ18nKVxuICAgIFxuICBmaWx0ZXJQYXJhbXM6IChwYXJhbXMpIC0+XG4gICAgXy5lYWNoIEBvcHRpb25zLmFjdGl2ZUZpbHRlcnMsIChmaWx0ZXIpID0+XG4gICAgICBwYXJhbXMgPSBfLnJlZHVjZSBwYXJhbXMsIChtZW1vLCB2YWwsIGtleSkgPT5cbiAgICAgICAgbWVtb1trZXldID0gQGZpbHRlcnNbZmlsdGVyXSh2YWwpXG4gICAgICAgIHJldHVybiBtZW1vXG4gICAgICAsIHt9XG4gICAgICBcbiAgICByZXR1cm4gcGFyYW1zXG4gICAgXG4gIGRlZmF1bHRzOlxuICAgIGFyZ3VtZW50U2VwYXJhdG9yOiAnX18nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyB3aGF0IGNoYXJhY3RlciBzaWduaWZpZXMgYSBuZXcga2V5L3ZhbHVlIGFyZ3VtZW50IHBhaXJcbiAgICBrZXlWYWx1ZVNlcGFyYXRvcjogJ18nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgd2hhdCBjaGFyYWN0ZXIgc2VwYXJhdGVzIHRoZSB2YWx1ZSBmcm9tIHRoZSBrZXlcbiAgICBhY3RpdmVGaWx0ZXJzOiBbJ2Jvb2xlYW5zJywgJ251bWJlcnMnLCAnYmxhbmsnXVxuICBcbiAgZmlsdGVyczpcbiAgICBib29sZWFuczogKHZhbCkgLT5cbiAgICAgIGlmIHZhbCBpcyAndHJ1ZSdcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIGVsc2UgaWYgdmFsIGlzICdmYWxzZSdcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB2YWxcbiAgICBudW1iZXJzOiAodmFsKSAtPlxuICAgICAgaWYgKG5vdCBpc05hTiB2YWwpIGFuZCAodmFsICE9IGZhbHNlKVxuICAgICAgICByZXR1cm4gK3ZhbFxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gdmFsXG4gICAgYmxhbms6ICh2YWwpIC0+XG4gICAgICBpZiB2YWwgaXMgdW5kZWZpbmVkXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB2YWxcblxuXG4jIEEgY2xhc3MgZm9yIG1ha2luZyBhIGxheWVyIHNjcm9sbGFibGUuXG5jbGFzcyBTY3JvbGxlclxuICBjb25zdHJ1Y3RvcjogKEBzY3JvbGxDb250YWluZXIsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBAb3B0aW9ucyA9IF8uZXh0ZW5kIHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMgICAgXG4gICAgXG4gICAgaWYgQG9wdGlvbnMuc2Nyb2xsQ29udGVudFxuICAgICAgQHJlcG9zaXRpb25Db250ZW50KClcblxuICAgIEBzZXRTY3JvbGxlckRpbWVuc2lvbnMoKVxuICAgIEBjcmVhdGVTY3JvbGxlcigpXG4gICAgQHNldHVwU2Nyb2xsRGlyZWN0aW9uKClcbiAgXG4gIGRlZmF1bHRzOlxuICAgIHBhZ2luYXRlZDogZmFsc2VcbiAgICBzY3JvbGxDb250ZW50OiBudWxsXG4gICAgc2Nyb2xsSW5kaWNhdG9yczogbnVsbFxuICAgIG9yaWdpblg6IDAuNVxuICAgIG9yaWdpblk6IDAuNVxuICAgIGluc2V0OlxuICAgICAgdG9wOiAwXG4gICAgICByaWdodDogMFxuICAgICAgYm90dG9tOiAwXG4gICAgICBsZWZ0OiAwXG4gIFxuICAjIENyZWF0ZXMgdGhlIHNjcm9sbENvbXBvbmVudCBvciBwYWdlQ29tcG9uZW50LCBhbmQgbWFrZXMgaXQgYWNjZXNzaWJsZVxuICAjIG9uIHRoZSBsYXllciBpdHNlbGYgYXMgbGF5ZXIuc2Nyb2xsQ29tcG9uZW50XG4gIGNyZWF0ZVNjcm9sbGVyOiAtPlxuICAgIGlmIEBvcHRpb25zLnBhZ2luYXRlZFxuICAgICAgQHNjcm9sbGVyID0gUGFnZUNvbXBvbmVudC53cmFwIEBzY3JvbGxDb250YWluZXJcbiAgICAgIEBzY3JvbGxlci5vcmlnaW5YID0gQG9wdGlvbnMub3JpZ2luWFxuICAgICAgQHNjcm9sbGVyLm9yaWdpblkgPSBAb3B0aW9ucy5vcmlnaW5ZXG4gICAgICBAc2V0dXBJbmRpY2F0b3JzKCkgaWYgQG9wdGlvbnMuc2Nyb2xsSW5kaWNhdG9yc1xuICAgIGVsc2VcbiAgICAgIEBzY3JvbGxlciA9IFNjcm9sbENvbXBvbmVudC53cmFwIEBzY3JvbGxDb250YWluZXJcblxuICAgIEBzY3JvbGxlci5jb250ZW50LmRyYWdnYWJsZS5kaXJlY3Rpb25Mb2NrID0gdHJ1ZVxuICAgIEBzY3JvbGxlci5jb250ZW50SW5zZXQgPSBAb3B0aW9ucy5pbnNldFxuXG4gICAgQHNjcm9sbENvbnRhaW5lci5zY3JvbGxDb21wb25lbnQgPSBAc2Nyb2xsZXJcblxuICAjIFNldHVwIHRoZSBwcm9wZXIgbGF5ZXJzIGFuZCBsYXllciBzdGF0ZXMgZm9yIHR1cm5pbmcgb24gYW5kIG9mZiBwYWdpbmF0aW9uIGluZGljYXRvcnNcbiAgc2V0dXBJbmRpY2F0b3JzOiAtPlxuICAgIG9uTGF5ZXIgPSBAb3B0aW9ucy5zY3JvbGxJbmRpY2F0b3JzLnN1YkxheWVyc0J5TmFtZSgnb24nKVswXS5jb3B5KClcbiAgICBvZmZMYXllciA9IEBvcHRpb25zLnNjcm9sbEluZGljYXRvcnMuc3ViTGF5ZXJzQnlOYW1lKCdvZmYnKVswXS5jb3B5KClcblxuICAgICMgQ3JlYXRlIGxheWVycyB0aGF0IGNvbnRhaW4gYm90aCB0aGUgb24gYW5kIG9mZiBpbmRpY2F0b3JzXG4gICAgZm9yIGluZGljYXRvciwgaSBpbiBAb3B0aW9ucy5zY3JvbGxJbmRpY2F0b3JzLnN1YkxheWVyc1xuICAgICAgaW5kaWNhdG9yV3JhcCA9IGluZGljYXRvci5jb3B5KClcbiAgICAgIGluZGljYXRvcldyYXAucHJvcHMgPSBuYW1lOiAnaW5kaWNhdG9yJywgc3VwZXJMYXllcjogaW5kaWNhdG9yLnN1cGVyTGF5ZXIsIGltYWdlOiBudWxsXG4gICAgICBpbmRpY2F0b3IuZGVzdHJveSgpXG5cbiAgICAgIGluZGljYXRvcldyYXAub25MYXllciA9IG9uTGF5ZXIuY29weSgpXG4gICAgICBpbmRpY2F0b3JXcmFwLm9mZkxheWVyID0gb2ZmTGF5ZXIuY29weSgpXG5cbiAgICAgIGZvciBsYXllciwgaSBpbiBbaW5kaWNhdG9yV3JhcC5vbkxheWVyLCBpbmRpY2F0b3JXcmFwLm9mZkxheWVyXVxuICAgICAgICBsYXllci5wcm9wcyA9IG9wYWNpdHk6IDAsIHg6IDAsIHN1cGVyTGF5ZXI6IGluZGljYXRvcldyYXBcbiAgICAgICAgbGF5ZXIuc3RhdGVzLmFkZCBvbjogb3BhY2l0eTogMVxuXG4gICAgQHVwZGF0ZUluZGljYXRvcnMoKVxuICAgIEBzY3JvbGxlci5vbiBcImNoYW5nZTpjdXJyZW50UGFnZVwiLCA9PlxuICAgICAgQHVwZGF0ZUluZGljYXRvcnMoKVxuXG4gIHVwZGF0ZUluZGljYXRvcnM6IC0+XG4gICAgZm9yIGluZGljYXRvciwgaSBpbiBfLnNvcnRCeShAb3B0aW9ucy5zY3JvbGxJbmRpY2F0b3JzLnN1YkxheWVycywgKGwpIC0+IGwueClcbiAgICAgIGlmIGkgaXMgQHNjcm9sbGVyLmhvcml6b250YWxQYWdlSW5kZXggQHNjcm9sbGVyLmN1cnJlbnRQYWdlXG4gICAgICAgIGluZGljYXRvci5vbkxheWVyLnN0YXRlcy5zd2l0Y2ggJ29uJ1xuICAgICAgICBpbmRpY2F0b3Iub2ZmTGF5ZXIuc3RhdGVzLnN3aXRjaCAnZGVmYXVsdCdcbiAgICAgIGVsc2VcbiAgICAgICAgaW5kaWNhdG9yLm9uTGF5ZXIuc3RhdGVzLnN3aXRjaCAnZGVmYXVsdCdcbiAgICAgICAgaW5kaWNhdG9yLm9mZkxheWVyLnN0YXRlcy5zd2l0Y2ggJ29uJ1xuXG4gICMgQ2FsY3VsYXRlcyB0aGUgb2Zmc2V0IG9mIGxheWVyIHJlbGF0aXZlIHRvIHRoZSBzY3JlZW5cbiAgZmluZE9mZnNldDogKGxheWVyLCBheGlzKSAtPlxuICAgIGlmIGxheWVyLnN1cGVyTGF5ZXJcbiAgICAgIHJldHVybiBsYXllcltheGlzXSArIEBmaW5kT2Zmc2V0KGxheWVyLnN1cGVyTGF5ZXIsIGF4aXMpXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGxheWVyW2F4aXNdXG5cblxuICBzZXRTY3JvbGxlckRpbWVuc2lvbnM6IC0+XG4gICAgQHNjcm9sbENvbnRhaW5lci53aWR0aCA9IHN3aXRjaCBAb3B0aW9ucy53aWR0aFxuICAgICAgd2hlbiAnZnVsbCcgdGhlbiBTY3JlZW4ud2lkdGhcbiAgICAgIHdoZW4gdW5kZWZpbmVkIHRoZW4gTWF0aC5taW4gQHNjcm9sbENvbnRhaW5lci53aWR0aCwgU2NyZWVuLndpZHRoXG4gICAgICBlbHNlIEBvcHRpb25zLndpZHRoXG4gICAgQHNjcm9sbENvbnRhaW5lci5oZWlnaHQgPSBzd2l0Y2ggQG9wdGlvbnMuaGVpZ2h0XG4gICAgICB3aGVuICdmdWxsJyB0aGVuIFNjcmVlbi5oZWlnaHRcbiAgICAgIHdoZW4gdW5kZWZpbmVkIHRoZW4gQHNjcm9sbENvbnRhaW5lci5oZWlnaHRcbiAgICAgIGVsc2UgQG9wdGlvbnMuaGVpZ2h0XG4gICAgICBcbiAgc2V0dXBTY3JvbGxEaXJlY3Rpb246IC0+XG4gICAgdW5sZXNzIEBvcHRpb25zLmhhc093blByb3BlcnR5ICdzY3JvbGxIb3Jpem9udGFsJ1xuICAgICAgQG9wdGlvbnMuc2Nyb2xsSG9yaXpvbnRhbCA9IEBzY3JvbGxlci5jb250ZW50LndpZHRoID4gQHNjcm9sbGVyLndpZHRoXG4gICAgdW5sZXNzIEBvcHRpb25zLmhhc093blByb3BlcnR5ICdzY3JvbGxWZXJ0aWNhbCdcbiAgICAgIEBvcHRpb25zLnNjcm9sbFZlcnRpY2FsID0gQHNjcm9sbGVyLmNvbnRlbnQuaGVpZ2h0ID4gQHNjcm9sbGVyLmhlaWdodFxuXG4gICAgQHNjcm9sbGVyLnNjcm9sbEhvcml6b250YWwgPSBAb3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsXG4gICAgQHNjcm9sbGVyLnNjcm9sbFZlcnRpY2FsID0gQG9wdGlvbnMuc2Nyb2xsVmVydGljYWxcblxuICByZXBvc2l0aW9uQ29udGVudDogLT5cbiAgICBwbGFjZWhvbGRlciA9IEBzY3JvbGxDb250YWluZXIuc3ViTGF5ZXJzQnlOYW1lKCdwbGFjZWhvbGRlcicpWzBdXG4gICAgcGxhY2Vob2xkZXJJbmRleCA9IHBsYWNlaG9sZGVyLmluZGV4XG5cbiAgICBAb3B0aW9ucy5pbnNldCA9XG4gICAgICB0b3A6IHBsYWNlaG9sZGVyLnlcbiAgICAgIHJpZ2h0OiBwbGFjZWhvbGRlci54XG4gICAgICBib3R0b206IHBsYWNlaG9sZGVyLnlcbiAgICAgIGxlZnQ6IHBsYWNlaG9sZGVyLnhcblxuICAgIEBvcHRpb25zLnNjcm9sbENvbnRlbnQucHJvcHMgPSB4OiAwLCB5OiAwXG5cbiAgICBpZiBAb3B0aW9ucy5zY3JvbGxDb250ZW50LnN1YkxheWVycy5sZW5ndGggPiAwXG4gICAgICBmb3IgaSwgbGF5ZXIgb2YgQG9wdGlvbnMuc2Nyb2xsQ29udGVudC5zdWJMYXllcnNcbiAgICAgICAgbGF5ZXIuc3VwZXJMYXllciA9IEBzY3JvbGxDb250YWluZXJcbiAgICBlbHNlXG4gICAgICBAb3B0aW9ucy5zY3JvbGxDb250ZW50LnN1cGVyTGF5ZXIgPSBwbGFjZWhvbGRlci5zdXBlckxheWVyXG5cbiAgICAjIEBvcHRpb25zLnNjcm9sbENvbnRlbnQuaW5kZXggPSBwbGFjZWhvbGRlckluZGV4XG4gICAgcGxhY2Vob2xkZXIuZGVzdHJveSgpXG5cblxuZXhwb3J0cy5TdGl0Y2ggPSBTdGl0Y2hcbiJdfQ==
