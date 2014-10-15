// Generated by CoffeeScript 1.6.3
(function() {
  var NGRAMS, RadialHistogramPlot, SPECTROGRAM_LENGTH, SimpleIndexPlot, SpectrogramApp, SpectrogramPlot, TILE_WIDTH, find, setup;

  find = function(obj, name) {
    var c, r, result, _i, _j, _len, _len1, _ref, _ref1;
    if ((obj.get('name') != null) && obj.get('name') === name) {
      return obj;
    }
    if (obj.get('children') != null) {
      _ref = obj.get('children');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        result = find(c, name);
        if (result != null) {
          return result;
        }
      }
    }
    if (obj.get('renderers') != null) {
      _ref1 = obj.get('renderers');
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        r = _ref1[_j];
        result = find(r, name);
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  };

  SpectrogramApp = (function() {
    function SpectrogramApp(layout) {
      var _this = this;
      this.request_data = _.throttle((function() {
        return _this._request_data();
      }), 20);
      this.paused = false;
      this.gain = 20;
      this.spectrogram_plot = new SpectrogramPlot(find(layout, "spectrogram"));
      this.signal_plot = new SimpleIndexPlot(find(layout, "signal"));
      this.power_plot = new SimpleIndexPlot(find(layout, "spectrum"));
      setInterval((function() {
        return _this.request_data();
      }), 400);
    }

    SpectrogramApp.prototype._request_data = function() {
      var _this = this;
      if (this.paused) {
        return;
      }
      return $.ajax('http://localhost:5000/data', {
        type: 'GET',
        dataType: 'json',
        cache: false,
        error: function(jqXHR, textStatus, errorThrown) {
          return null;
        },
        success: function(data, textStatus, jqXHR) {
          return _this.on_data(data);
        },
        complete: function(jqXHR, status) {
          return requestAnimationFrame(function() {
            return _this.request_data();
          });
        }
      });
    };

    SpectrogramApp.prototype.on_data = function(data) {
      var power, signal, spectrum, x;
      signal = (function() {
        var _i, _len, _ref, _results;
        _ref = data.signal;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * this.gain);
        }
        return _results;
      }).call(this);
      spectrum = (function() {
        var _i, _len, _ref, _results;
        _ref = data.spectrum;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * this.gain);
        }
        return _results;
      }).call(this);
      power = (function() {
        var _i, _len, _ref, _results;
        _ref = data.spectrum;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * x);
        }
        return _results;
      })();
      this.spectrogram_plot.update(spectrum);
      this.signal_plot.update(signal);
      return this.power_plot.update(power);
    };

    return SpectrogramApp;

  })();

  SPECTROGRAM_LENGTH = 512;

  NGRAMS = 800;

  TILE_WIDTH = 500;

  SpectrogramPlot = (function() {
    function SpectrogramPlot(model) {
      var i, _i, _ref;
      this.model = model;
      this.source = this.model.get('data_source');
      this.cmap = new Bokeh.LinearColorMapper.Model({
        palette: Bokeh.Palettes.all_palettes["YlGnBu-9"],
        low: 0,
        high: 10
      });
      this.num_images = Math.ceil(NGRAMS / TILE_WIDTH) + 3;
      this.image_width = TILE_WIDTH;
      this.images = new Array(this.num_images);
      for (i = _i = 0, _ref = this.num_images - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.images[i] = new ArrayBuffer(SPECTROGRAM_LENGTH * this.image_width * 4);
      }
      this.xs = new Array(this.num_images);
      this.col = 0;
    }

    SpectrogramPlot.prototype.update = function(spectrum) {
      var buf, buf32, i, image32, img, _i, _j, _ref;
      buf = this.cmap.v_map_screen(spectrum);
      for (i = _i = 0, _ref = this.xs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.xs[i] += 1;
      }
      this.col -= 1;
      if (this.col === -1) {
        this.col = this.image_width - 1;
        img = this.images.pop();
        this.images = [img].concat(this.images.slice(0));
        this.xs.pop();
        this.xs = [1 - this.image_width].concat(this.xs.slice(0));
      }
      image32 = new Uint32Array(this.images[0]);
      buf32 = new Uint32Array(buf);
      for (i = _j = 0; 0 <= SPECTROGRAM_LENGTH ? _j < SPECTROGRAM_LENGTH : _j > SPECTROGRAM_LENGTH; i = 0 <= SPECTROGRAM_LENGTH ? ++_j : --_j) {
        image32[i * this.image_width + this.col] = buf32[i];
      }
      this.source.set('data', {
        image: this.images,
        x: this.xs
      });
      return this.source.trigger('change', this.source);
    };

    SpectrogramPlot.prototype.set_yrange = function(y0, y1) {
      return this.view.y_range.set({
        'start': y0,
        'end': y1
      });
    };

    return SpectrogramPlot;

  })();

  RadialHistogramPlot = (function() {
    function RadialHistogramPlot(model) {
      this.model = model;
      this.source = this.model.get('data_source');
    }

    RadialHistogramPlot.prototype.update = function(bins) {
      var alpha, angle, end, i, inner, outer, range, start, _i, _j, _ref, _ref1, _ref2, _results;
      angle = 2 * Math.PI / bins.length;
      _ref = [[], [], [], [], []], inner = _ref[0], outer = _ref[1], start = _ref[2], end = _ref[3], alpha = _ref[4];
      for (i = _i = 0, _ref1 = bins.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        range = (function() {
          _results = [];
          for (var _j = 0, _ref2 = bins[i]; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--){ _results.push(_j); }
          return _results;
        }).apply(this);
        inner = inner.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            i = range[_k];
            _results1.push(i + 2);
          }
          return _results1;
        })());
        outer = outer.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            i = range[_k];
            _results1.push(i + 2.95);
          }
          return _results1;
        })());
        start = start.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            i = range[_k];
            _results1.push((i + 0.05) * angle);
          }
          return _results1;
        })());
        end = end.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            i = range[_k];
            _results1.push((i + 95) * angle);
          }
          return _results1;
        })());
        alpha = alpha.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            i = range[_k];
            _results1.push(1 - 0.08 * i);
          }
          return _results1;
        })());
      }
      this.source.set('data', {
        inner_radius: inner,
        outer_radius: outer,
        start_angle: start,
        end_angle: end,
        fill_alpha: alpha
      });
      return this.source.trigger('change', this.source);
    };

    return RadialHistogramPlot;

  })();

  SimpleIndexPlot = (function() {
    function SimpleIndexPlot(model) {
      var plot;
      this.model = model;
      this.source = this.model.get('data_source');
      plot = this.model.attributes.parent;
      this.x_range = plot.get('frame').get('x_ranges')[this.model.get('x_range_name')];
    }

    SimpleIndexPlot.prototype.update = function(y) {
      var end, i, idx, start;
      start = this.x_range.get('start');
      end = this.x_range.get('end');
      idx = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = y.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(start + (i / y.length) * end);
        }
        return _results;
      })();
      this.source.set('data', {
        idx: idx,
        y: y
      });
      return this.source.trigger('change', this.source);
    };

    SimpleIndexPlot.prototype.set_xrange = function(x0, x1) {
      return this.x_range.set({
        'start': x0,
        'end': x1
      });
    };

    return SimpleIndexPlot;

  })();

  setup = function() {
    var app, id, index;
    index = window.Bokeh.index;
    if (_.keys(index).length === 0) {
      console.log("Bokeh not loaded yet, waiting to set up SpectrogramApp...");
      return setTimeout(setup, 200);
    } else {
      console.log("Bokeh loaded, starting SpectrogramApp");
      id = _.keys(index)[0];
      return app = new SpectrogramApp(index[id].model);
    }
  };

  setTimeout(setup, 200);

}).call(this);
