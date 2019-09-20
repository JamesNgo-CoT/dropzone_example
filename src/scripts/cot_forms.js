var IEversion = (navigator.userAgent.indexOf("MSIE") > 1) ? parseInt(navigator.userAgent.substr(navigator.userAgent.indexOf("MSIE") + 5, 5)) : 99;

/*
You can build forms with cot_form, but it is preferable to use CotForm (lower down in this file).
You shouldn't really use cot_form or any of its methods unless you really know what you are doing.
 */
var cot_form = function (o) {
  this.id = o.id; //the id to assign this form. this is used for the associated HTML form element id
  this.title = o.title; //if specified, an H2 is added to the top of the form with this text in it
  this.success = o.success; //a function to call after form validation passes

  //the absolute url path to the application's root folder, required when using any validationtype=Phone fields
  // embedded example: '/resources/app_name/'
  // standalone example: '/webapps/app_name/'
  this.rootPath = o.rootPath;

  this.sections = [];
};

cot_form.addDefaultFieldProperties = function (fields) {
  cot_form.fixClassProperty(fields);
  (fields || []).forEach(function (fld) {
    fld.type = fld['type'] || 'text';
    fld.id = fld['id'] || Math.random().toString().split('.')[1];
    if ('html button static'.indexOf(fld.type) === -1 && !fld['title']) {
      console.warn('Missing title attribute for field ' + fld.id);
    }
    if (['radio', 'checkbox', 'dropdown', 'multiselect'].indexOf(fld.type) > -1 && !$.isArray(fld['choices'])) {
      throw new Error('Error in field ' + fld['id'] + ': choices property is missing or invalid');
    }
    if (fld.type === 'datetimepicker') {
      fld.options = $.extend({
        format: 'MM/DD/YYYY'
      }, fld.options);
    }
    if (fld.type === 'daterangepicker') {
      fld.options = $.extend({
        locale: {
          format: 'MM/DD/YYYY',
          separator: " - "
        }
      }, fld.options);
    }

  });
  return fields;
};
//class is a reserved keyword, it should never have been used, and is causing issues in IE now
//here we try fix any instances of usage of class instead of the newer className
cot_form.fixClassProperty = function (objectOrArray) {
  $.each($.makeArray(objectOrArray || []), function (i, o) {
    if (o['className'] === undefined && typeof o['class'] === 'string') { //this is a hack
      o['className'] = o['class'];
      delete o['class'];
    }
  });
}
var cot_section = function (o) {
  cot_form.fixClassProperty(o);
  this.id = o.id;
  this.title = o.title;
  this.className = o['className'];
  this.readSectionName = o['readSectionName'];
  this.rows = [];
};

var cot_row = function (o) {
  this.fields = cot_form.addDefaultFieldProperties(o); //this is an array of raw javascript objects describing fields
  this.type = 'standard';
};

var cot_grid = function (o) {
  cot_form.fixClassProperty(o);
  this.id = (o.id || "") ? o.id : 'grid-' + Math.floor(Math.random() * 100000000);
  this.add = (o.add || "") ? true : false;
  this.className = o['className'];
  this.title = o.title;
  this.headers = o.headers;
  this.fields = cot_form.addDefaultFieldProperties(o.fields);
  this.type = 'grid';
};

cot_form.prototype.addSection = function (o) {
  if (!(o instanceof cot_section)) {
    o = new cot_section(o);
  }
  this.sections.push(o);
  return o;
};

cot_section.prototype.addRow = function (o) {
  if (!(o instanceof cot_row)) {
    o = new cot_row(o);
  }
  this.rows.push(o);
  return this;
};

cot_section.prototype.addGrid = function (o) {
  if (!(o instanceof cot_grid)) {
    o = new cot_grid(o);
  }
  this.rows.push(o);
  return this;
};

var cot_repeatControl = function (opts) {
  cot_form.fixClassProperty(opts);

  // Properties.
  for (var k in opts) {
    if (opts.hasOwnProperty(k)) {
      this[k] = opts[k];
    }
  }

  // ID.
  if (!this.id) {
    this.id = 'repeatControl-' + Math.floor(Math.random() * 10000000);
  }

  // Min, max, initial.
  if (this.min == null) {
    this.min = 0;
  }
  if (this.max == null || this.max < this.min) {
    this.max = -1;
  }
  if (this.initial == null || this.initial < this.min
    || (this.max != -1 && this.initial > this.max)) {

    if (this.max != -1 && this.initial > this.max) {
      this.initial = this.max;
    } else {
      this.initial = this.min;
    }
  }

  // Rows.
  if (this.rows) {
    var l = this.rows.length;
    for (var i = 0; i < l; i++) {
      if (this.rows[i].fields) {
        this.rows[i].fields = cot_form.addDefaultFieldProperties(this.rows[i].fields);
      } else if (this.rows[i].grid) {
        var grid = new cot_grid(this.rows[i].grid);
      }

      // TODO - Grid.
      // TODO - Repeat control.
    }
  }

  this.type = 'repeatcontrol';
};

cot_section.prototype.addRepeatControl = function (o) {
  if (!(o instanceof cot_repeatControl)) {
    o = new cot_repeatControl(o);
  }
  this.rows.push(o);
  return this;
};

cot_form.prototype.render = function (o) {
  /*
   o = {
   target: '#element_id', //required. specify a css selector to where the form should be rendered
   formValidationSettings: {} //optional, when specified, the attributes in here are passed through to the formValidation constructor: http://formvalidation.io/settings/
   }
   */
  var app = this;
  var oVal = {
    fields: {}
  };
  var form = document.createElement('form');
  form.id = this.id;
  form.className = 'cot-form';
  form.setAttribute("data-fv-framework", "bootstrap");
  form.setAttribute("data-fv-icon-valid", "glyphicon glyphicon-ok");
  form.setAttribute("data-fv-icon-invalid", "glyphicon glyphicon-remove");
  form.setAttribute("data-fv-icon-validating", "glyphicon glyphicon-refresh");

  if (this.title || "") {
    var formHead = form.appendChild(document.createElement('h2'));
    formHead.textContent = this.title;
  }
  $.each(this.sections, function (i, section) {
    var oPanel = form.appendChild(document.createElement('div'));
    oPanel.id = section.id;


    oPanel.className = (section['className'] !== undefined) ? 'panel ' + section.className : "panel panel-default";
    if (section.title || "") {
      var oPanelHead = oPanel.appendChild(document.createElement('div'));
      oPanelHead.className = 'panel-heading';
      var oH3 = oPanelHead.appendChild(document.createElement('h3'));
      var oSpan = oH3.appendChild(document.createElement('span'));
      oSpan.className = "glyphicon glyphicon-th-large";
      oH3.appendChild(document.createElement('span'));
      oH3.textContent = section.title;
      // issue #141 adding an ID to H3 to reference it in input by aria-labelledby
      if (section['readSectionName']) {
        oH3.id = section.id + '_title';
      }
    }
    var oPanelBody = oPanel.appendChild(document.createElement('div'));
    oPanelBody.className = 'panel-body';

    $.each(section.rows, function (k, row) {
      var oRow = oPanelBody.appendChild(document.createElement('div'));
      oRow.className = 'row';
      if (row.type == 'repeatcontrol') {
        app.processRepeatControl(oRow, oVal, row);
      } else if (row.type == 'grid') {
        app.processGrid(oRow, oVal, row);
      } else {
        $.each(row.fields, function (l, field) {
          app.processField(oRow, oVal, row, field);
        });
      }
    });
  });
  $(o.target).append(form);
  $.each(this.sections, function (i, section) {
    $.each(section.rows, function (k, row) {
      app.initializePluginsInRow(row);
    });
  });


  //INITIATE FORM VALIDATION
  var frm = $('#' + this.id);
  var options = $.extend({
    excluded: [':not(.multiselect):disabled', ':not(.multiselect):hidden', ':not(.multiselect):not(:visible)'], //exclude all hidden and disabled fields that are not multiselects
    feedbackIcons: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    onSuccess: this.success,
    onError: function (e) {
      console.log('Validation error occurred:', e);
      var moveTo = $($(".has-error input:visible, .has-error select:visible, .has-error button:visible, .has-error textarea:visible")[0]);

      // TODO Add focus to dropzone item causing the error
      if (Dropzone) {
        var $dzFormField = moveTo.closest('.dz-form-field');
        if ($dzFormField.length > 0) {
          $dzFormField = $dzFormField.eq(0);
          var $hiddenInput = $dzFormField.parent().find('input[type="hidden"]');
          if ($hiddenInput.length > 0) {
            $hiddenInput = $hiddenInput.eq(0);
            var cotDropzone = $hiddenInput[0].cotDropzone;
            for (var index = 0, length = cotDropzone.dropzone.files.length; index < length; index++) {
              if (cotDropzone.dropzone.files[index].status === Dropzone.ERROR) {
                moveTo = $(cotDropzone.dropzone.files[index].previewElement);
                moveTo.attr('tabIndex', '-1');
                break;
              }
            }
          }
        }
      }

      moveTo.focus();
      if (moveTo[0]['getBoundingClientRect']) {
        var rect = moveTo[0].getBoundingClientRect();
        console.log(rect.top, rect.top < 0, rect.top > $(window).height() - 50, rect.top < 0 || rect.top > $(window).height() - 50);
        if (rect.top < 0 || rect.top > $(window).height() - 50) {
          $('html,body').animate({
            scrollTop: Math.max(0, moveTo.offset().top - 100)
          }, 'slow');
        }
      }
    },
    fields: oVal.fields
  }, o['formValidationSettings'] || {});

  frm.formValidation(options)
    .on('err.field.fv', function (e) {
      $(e.target).closest('.form-group').find('input,select,textarea').attr('aria-invalid', true);
    })
    .on('success.field.fv', function (e, data) {
      $(e.target).closest('.form-group').find('input,select,textarea').attr('aria-invalid', false);
    })
    .on('err.form.fv', function (e) {
      // NOTE I dont know what this was for.
      // var $firstError = $('.has-error', frm).first();
      // var $firstErrorInput = $firstError.find('input');
      // if ($firstErrorInput && $firstErrorInput.prop('type') === 'hidden') {
      //   $firstError.find('button').first().focus();
      // }
    });
  frm.find("button.fv-hidden-submit").text("hidden submit button");
  frm.find("button.fv-hidden-submit").attr("aria-hidden", true);

  app.fixFormValidationRender(frm);
};

cot_form.prototype.fixFormValidationRender = function (el) {
  el.find('i.form-control-feedback').attr('aria-hidden', 'true');
  //this will override feedback icon insertion into a wrong place after the form is rendered
  el.find("label.radioLabel>i, label.checkboxLabel>i").each(function () {
    var $this = $(this);
    $this.insertAfter($this.closest('fieldset').find('legend'));
  });
  el.find('div.datetimepicker').each(function () {
    //because the datetimepicker div.entryField also has .input-group class, the feedback icons are put in the wrong spot
    var $this = $(this);
    $this.parent().find('i.form-control-feedback').insertAfter($this.find('input'));
  });
};

cot_form.prototype.initializePluginsInRow = function (row, $container) {
  if (!$container) {
    $container = $('#' + this.id);
  }
  var that = this;
  $.each(row.fields, function (l, field) {

    switch (field['type']) {
      case 'multiselect':
        var $el = $container.find("." + field.id + ".multiselect");
        (window['cot_app'] || window['CotApp']).addMultiselect({
          $select: $el,
          ariaLabelledBy: $el.attr('aria-labelledby'),
          ariaDescribedBy: $el.attr('aria-describedby'),
          ariaRequired: $el.attr('aria-required'),
          multiselectOptions: field.options
        });

        break;
      case 'daterangepicker':
        $container.find(".daterangevalidation") //TODO: support multiple instances of daterangepicker
          .daterangepicker(field.options)
          .on('show.daterangepicker', function (ev, picker) {
            $($(picker)[0]).focus();
          });
        $('.daterangepicker').attr('aria-hidden', true);
        break;
      case 'datetimepicker':
        $container.find("." + field.id + ".datetimepicker")
          .datetimepicker(field.options)
          .on("dp.change", function () {
            var sName = $(this).attr("data-refid");
            $("#" + that.id).data('formValidation').updateStatus(sName, 'NOT_VALIDATED').validateField(sName);
          });
        break;
      default:
        if (field.validationtype === "Phone" && IEversion >= 10) {
          if (typeof that['rootPath'] !== 'string') {
            throw new Error('rootPath must be defined for cot form when using Phone fields');
          }
          $container.find("#" + field.id + ".phonevalidation, [name$=\"." + field.id + "\"].phonevalidation")
            .each(function (i, el) {
              var $el = $(el);
              if ($el.attr('name').indexOf('[template]') === -1) {
                $el.attr('type', 'tel');
                $el.intlTelInput($.extend({
                  autoPlaceholder: false,
                  allowDropdown: false,
                  preferredCountries: ['ca'],
                  utilsScript: that.rootPath + 'js/utils.js'
                }, field.options || {}));
                $el.on("country-change", function () {
                  var sName = $(this).attr("name");
                  $("#" + that.id).data('formValidation').updateStatus(sName, 'NOT_VALIDATED').validateField(sName);
                });

                $('#' + field.id).insertBefore($("#" + field.id).prev());
                setTimeout(function () {
                  $('#' + field.id).parent().find('.flag-container').insertBefore($('#' + field.id).parent().find('.flag-container').prev());
                }, 300);
              }
            });

          $container.find('.flag-dropdown').attr('aria-hidden', true);

        }
    }

  });
  $container.find('[data-toggle="tooltip"]').tooltip({
    "html": true
  });
};

cot_form.prototype.processRepeatControl = function (oRow, oVal, row) {
  var idxAffix = '___idx___';

  // Save index.
  this.repeatControlIndex = this.repeatControlIndex || {};
  this.repeatControlIndex[row.id] = 0;

  // Element.
  var $element = $([
    '<div class="repeatControl">',
    '<div class="repeatControl-wrapper">',
    '<div class="repeatControl-title"></div>',
    '<div class="repeatControl-set repeatControl-template">',
    '<div class="repeatControl-set-title"></div>',
    '<div class="repeatControl-set-rows"></div>',
    '<p class="repeatControl-set-button">',
    '<button class="btn" type="button">',
    '<span class="glyphicon"></span><span class="repeatControl-set-button-label"></span>',
    '</button>',
    '</p>',
    '</div>',
    '<div class="repeatControl-sets"></div>',
    '<p class="repeatControl-button">',
    '<button class="btn" type="button">',
    '<span class="glyphicon"></span><span class="repeatControl-button-label"></span>',
    '</button>',
    '</p>',
    '</div>',
    '</div>'
  ].join(''));
  $element.attr('id', row.id);
  $element.addClass(row.className || 'col-xs-12');

  // Append.
  $(oRow).append($element);

  // Title.
  if (row.title) {
    $('.repeatControl-title', $element).append($('<h4>').text(row.title));
  }

  // Set template.
  $('.repeatControl-template', $element).addClass(row.setClassName || '')

  // Set title.
  if (row.setTitle) {
    $('.repeatControl-set-title', $element).append($('<h5>').text(row.setTitle));
  }

  var fieldDefinitions = {};
  var fieldsForPlugin = [];

  // Set rows.
  var rows = row.rows || [];
  var l = rows.length;
  for (var i = 0; i < l; i++) {
    var $row = $('<div class="row">');
    $('.repeatControl-set-rows', $element).append($row);

    if (rows[i].fields) {
      var fields = rows[i].fields || [];
      var l2 = fields.length;
      for (var i2 = 0; i2 < l2; i2++) {
        var field = $.extend({}, fields[i2], { id: row.id + idxAffix + fields[i2].id });
        fieldDefinitions[field.id] = field;
        fieldsForPlugin.push(field);
        this.processField($row[0], oVal, rows[i], field);
      }
    } else if (rows[i].grid) {

      rows[i].grid.id = [row.id, idxAffix, rows[i].grid.id].join('');
      var fields = rows[i].grid.fields || [];
      var l2 = fields.length;
      for (var i2 = 0; i2 < l2; i2++) {
        $.extend(rows[i].grid.fields[i2], {
          id: [row.id, idxAffix, rows[i].grid.fields[i2].id].join(''),
          type: rows[i].grid.fields[i2].type || 'text'
        });
      }
      $row.attr('data-grid', rows[i].grid.id);

    } else if (rows[i].repeatcontrol) {
      // TODO - Repeat control.
    }
  }

  // Set 'minus' button.
  $('.repeatControl-set-button', $element).addClass(row.removeClassName || '');
  $('.repeatControl-set-button .btn', $element).addClass(row.removeBtnClassName || 'btn-default');
  $('.repeatControl-set-button .glyphicon', $element).addClass(row.removeBtnGlyphicon || 'glyphicon-minus');
  $('.repeatControl-set-button-label', $element).text(row.removeBtnLabel || 'Remove row' + (row.title ? ' to ' + row.title : ''));

  // Control 'plus' button.
  $('.repeatControl-button', $element).addClass(row.addClassName || '');
  $('.repeatControl-button .btn', $element).addClass(row.addBtnClassName || 'btn-default');
  $('.repeatControl-button .glyphicon', $element).addClass(row.addBtnGlyphicon || 'glyphicon-plus');
  $('.repeatControl-button-label', $element).text(row.addBtnLabel || ' Add row' + (row.title ? ' to ' + row.title : ''));

  var app = this;

  $element[0].removeRows = function () {

    app.repeatControlIndex[row.id] = 0;
    $element[0].resetMode = true;

    $('.repeatControl-sets .repeatControl-set-button .btn', $element).trigger('click');
    $element[0].resetMode = false;
    for (var i = 0; i < row.initial; i++) {
      $element[0].addRow();
    }
  };

  $element[0].addRow = function () {
    var idx = app.repeatControlIndex[row.id];
    if (row.max == -1 || $('.repeatControl-sets .repeatControl-set-button .btn', $element).length < row.max) {

      //CLONE THE TEMPLATE TO CREATE A NEW GRID ROW
      var $template = $('.repeatControl-template', $element);
      var $clone = $template
        .clone()
        .removeClass('repeatControl-template');

      var html = $clone.html()
      html = html.replace(new RegExp(idxAffix, 'g'), '_' + app.repeatControlIndex[row.id] + '_');
      $clone.html(html);

      $('.repeatControl-sets', $element).append($clone);

      var rows = row.rows;
      var rl = rows.length;
      for (var ri = 0; ri < rl; ri++) {

        if (!rows[ri].grid) {
          continue;
        }

        var grid = $.extend({}, rows[ri].grid, {
          id: rows[ri].grid.id.replace(idxAffix, '_' + app.repeatControlIndex[row.id] + '_')
        });
        var fields = grid.fields;
        var fl = fields.length;
        grid.fields = [];
        for (var fi = 0; fi < fl; fi++) {
          if (fields[fi].id) {
            grid.fields.push($.extend({}, fields[fi], {
              id: fields[fi].id.replace(idxAffix, '_' + app.repeatControlIndex[row.id] + '_')
            }));
          }
        }
        var $row = $('[data-grid="' + grid.id + '"]', $clone);
        app.processGrid($row[0], oVal, grid);

        var fields2 = grid.fields;
        var fl2 = fields2.length;
        for (var fi2 = 0; fi2 < fl2; fi2++) {
          var $item = $('[name="row[0].' + fields2[fi2].id + '"]');
          $('#' + app.id).formValidation('addField', $item, oVal.fields['row[0].' + fields2[fi2].id]);
          // var validatorOptions = app.validatorOptions(oVal.fields['row[0].' + fields2[fi2].id]);
          // $('#' + app.id).formValidation('addField', $item.attr('name'), validatorOptions);

          if (row.bindTo) {
            app._cotForm._setupField($item, fields2[fi2], row.bindTo + '[' + idx + '].' + grid.bindTo + '[0]');
          }
        }

        app.initializePluginsInRow(grid, $clone);
        app.fixFormValidationRender($clone);

        // Add button
        var addButton = $('#' + grid.id + ' button.grid-add', $row).get(0);
        addButton.onclick = (function (oldOnClick, gridDef) {
          return function (e) {
            oldOnClick(e);

            var form = app;

            var $newRow = $('#' + gridDef.id + ' [data-row-index]:last');

            // Remove button
            var $minButton = $('button.grid-minus', $newRow);
            $minButton.off('click').on('click', function (e) {
              var $gridRows = $('#' + gridDef.id + ' [data-row-index]');
              var $currentRow = $(this).closest('[data-row-index]');
              var idx = $gridRows.index($currentRow);

              if (form._cotForm && form._cotForm._model && form._cotForm._model.get(gridDef.bindTo)) {
                var collection = form._cotForm._model.get(gridDef.bindTo);
                if (collection && collection.models) {
                  collection.remove(collection.models[idx]);
                }
              }
              // ORIGINAL CODE
              var $row = $(this).closest('tr');
              $.each($row.find('.form-control'), function (i, item) {
                var $item = $(item);
                var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name');
                $('#' + form.id).formValidation('removeField', itemId);
              });
              var focusEl = $row.prev().find('input,select,textarea').first();
              $row.remove();
              focusEl.focus();
            });

            if (form._cotForm && form._cotForm._model && form._cotForm._model.get(gridDef.bindTo)) {
              var collection = form._cotForm._model.get(gridDef.bindTo);
              if (collection) {
                collection.push(new CotModel());
              }
            }
            var prefixIdx = +$newRow.attr('data-row-index');
            var prefix = 'row[' + prefixIdx + '].';
            (gridDef['fields'] || []).forEach(function (field) {
              form._cotForm._setupField($('[name="' + prefix + field.id + '"]'), field, row.bindTo + '[' + idx + '].' + gridDef.bindTo + '[' + prefixIdx + ']');
            });
          }
        })(addButton.onclick, grid);
      }

      //ADD THE PROPER DELETE FUNCTION TO THE DELETE ROW BUTTON FOR THE NEW ROW
      $('.repeatControl-set-button .btn', $clone).click(function (e) {

        if ($element[0].resetMode == true || $('.repeatControl-sets .repeatControl-set-button .btn', $element).length > row.min) {
          for (var k in fieldDefinitions) {
            $('#' + app.id).formValidation('removeField', $('[name="' + k + '"]', $clone));
          }

          if (row.bindTo && app._cotForm._model && app._cotForm._model.get(row.bindTo)) {
            var index = $('.repeatControl-sets .repeatControl-set', $element).index($clone);
            var repeatControlCollection = app._cotForm._model.get(row.bindTo);
            repeatControlCollection.remove(repeatControlCollection.at(index));
          }

          $clone.remove();

          if (row.removeBtnOnClick) {
            row.removeBtnOnClick(e);
          }
        }
      });

      //ADD EACH FIELD IN THE NEW GRID ROW TO THE FORM VALIDATOR
      var index = $('.repeatControl-sets .repeatControl-set', $element).index($clone);
      if (row.bindTo && app._cotForm._model) {
        if (!app._cotForm._model.get(row.bindTo)) {
          app._cotForm._model.set(row.bindTo, new CotCollection());
        }
        var repeatControlCollection = app._cotForm._model.get(row.bindTo);
        repeatControlCollection.push(new CotModel({}));
      }
      for (var k in fieldDefinitions) {
        var id = k.replace(idxAffix, '_' + app.repeatControlIndex[row.id] + '_');
        var errId = 'fv_err_msg_' + id;
        var $item = $('[name="' + id + '"]', $clone);
        var $err = $item.closest('.entryField').nextAll('.fv-err-msg');
        $err.attr('id', errId);
        $err.empty();

        fieldDefinitions[k].id = id;

        $item.attr('aria-describedby', errId);

        var validationOption = app.validatorOptions(fieldDefinitions[k]);
        validationOption.err = '#' + errId;

        if ($('#' + app.id).length > 0) {
          $('#' + app.id).formValidation('addField', $item.attr('name'), validationOption);
        } else {
          oVal.fields[id] = validationOption;
        }

        // Data binding
        if (row.bindTo) {
          app._cotForm._setupField($item, fieldDefinitions[k], row.bindTo + '[' + index + ']');
        }
      }

      app.initializePluginsInRow({ fields: fieldsForPlugin }, $clone);
      app.fixFormValidationRender($clone);

      $clone.find('input, select, textarea').first().focus();

      app.repeatControlIndex[row.id] = app.repeatControlIndex[row.id] + 1;
    }
  }

  $element[0].setCotForm = function (cotForm) {
    this.cotForm = cotForm;
  }

  // Add button click.
  $('.repeatControl-button .btn', $element).click(function (e) {
    $element[0].addRow();
    if (row.addBtnOnClick) {
      row.addBtnOnClick(e);
    }
  })

  $element[0].removeRows();
}

cot_form.prototype.processGrid = function (oRow, oVal, row) {
  var app = this,
    oBTN;
  var oGrid = oRow.appendChild(document.createElement('div'));
  oGrid.id = row.id;
  oGrid.className = 'grid-object table-responsive ';
  oGrid.className += row['className'] || '';
  oGrid.className += (row.addclass || '') ? " " + row.addclass : '';
  app[oGrid.id + "-index"] = 0;
  var oGridHead = oGrid.appendChild(document.createElement('h4'));
  oGridHead.className = 'grid-title';
  oGridHead.textContent = row.title;
  var oTable = oGrid.appendChild(document.createElement('table'));
  oTable.className = 'grid-table table table-striped';
  var oGridCaption = oTable.appendChild(document.createElement('caption'));
  oGridCaption.className = "sr-only";
  oGridCaption.textContent = row.title;
  var oTR = oTable.appendChild(document.createElement('tr'));

  //ADD HEADERS
  $.each(row.headers, function (i, header) {
    var oTH = oTR.appendChild(document.createElement('th'));
    oTH.textContent = header.title;
    oTH.id = row.id + "_header_" + i;
    $(oTH).attr('scope', 'col');
  });
  //ADD AN EXTRA COLUMN WHICH WILL BE USED TO HOLD THE ADD/DELETE BUTTONS
  oTH = oTR.appendChild(document.createElement('th'));
  $(oTH).attr('scope', 'col');
  var oSpan = oTH.appendChild(document.createElement('span'));
  oSpan.className = "sr-only";
  oSpan.textContent = "Add/Remove Entries";

  //ADD FIRST ROW OF GRID
  oTR = oTable.appendChild(document.createElement('tr'));
  oTR.id = row.id + "-row-0";
  oTR.setAttribute('data-row-index', "0");
  var fieldDefinitions = {}; //used to get options when adding new rows dynamically
  $.each(row.fields, function (l, field) {
    var oFieldDiv = oTR.appendChild(document.createElement('td'));
    oFieldDiv.className = "form-group";
    oFieldDiv.className += (field.addclass || '') ? " " + field.addclass : '';
    field.grid = "0";
    field.gridlabel = row.id + "_header_" + l;
    if (l === 0) {
      var span = oFieldDiv.appendChild(document.createElement('span'));
      span.className = 'sr-only';
      span.id = oGrid.id + '_row_sr_label_0';
      span.textContent = row.title + ' entry 1';
    }
    app.addformfield(field, oFieldDiv);
    //create a validator specifically for the zero row.
    var tmpfieldId = field.id;
    field.id = "row[0]." + field.id;
    app.addfieldvalidation(oVal, field, oFieldDiv);
    field.id = tmpfieldId;
    fieldDefinitions[field.id] = field;
  });

  //ADD A FAKE REMOVE BUTTON AT THE END OF THE FIRST ROW
  var oTD = oTR.appendChild(document.createElement('td'));
  oTD.className = 'text-right';
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.className = 'btn btn-default grid-minus';
  oBTN.type = 'button';
  oBTN.disabled = true;
  oBTN.title = 'Remove entry 1 from ' + row.title;
  oBTN.appendChild(document.createElement('span')).className = 'glyphicon glyphicon-minus';
  var oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.className = 'sr-only';
  oSpan.textContent = "Remove entry 1";

  //ADD GRID TEMPLATE THAT CAN BE USED TO CREATE NEW ROWS
  oTR = oTable.appendChild(document.createElement('tr'));
  oTR.id = oGrid.id + "-template";
  oTR.className = "hide";
  $.each(row.fields, function (l, field) {
    var oFieldDiv = oTR.appendChild(document.createElement('td'));
    oFieldDiv.className = "form-group";
    oFieldDiv.className += field.addclass ? " " + field.addclass : '';
    field.grid = "template";
    if (l === 0) {
      var span = oFieldDiv.appendChild(document.createElement('span'));
      span.className = 'sr-only';
      span.id = oGrid.id + '_row_sr_label_template';
      span.textContent = row.title + ', row template';
    }
    app.addformfield(field, oFieldDiv);
  });

  //ADD A BUTTON AT THE END OF THE TEMPLATE ROW TO REMOVE A ROW FROM THE GRID
  oTD = oTR.appendChild(document.createElement('td'));
  oTD.className = 'text-right';
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.type = 'button';
  oBTN.className = 'btn btn-default grid-minus';
  oBTN.title = 'Remove entry displayRowNumber from ' + row.title;
  oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.className = 'glyphicon glyphicon-minus';
  oSpan = oSpan.appendChild(document.createElement('span'));
  oSpan.className = 'sr-only';
  oSpan.textContent = 'Remove entry displayRowNumber';

  //Add a 'new' button to the last row
  oTR = oTable.appendChild(document.createElement('tr'));
  oTD = oTR.appendChild(document.createElement('td'));
  oTD.colSpan = row.fields.length + 1;
  oBTN = oTD.appendChild(document.createElement('button'));
  oBTN.className = 'btn btn-default pull-right grid-add';
  oBTN.type = 'button';
  oBTN.onclick = function () {
    app[oGrid.id + "-index"]++;
    var rowIndex = app[oGrid.id + "-index"];
    //CLONE THE TEMPLATE TO CREATE A NEW GRID ROW
    var $template = $('#' + oGrid.id + '-template');
    var $clone = $template
      .clone()
      .removeClass('hide')
      .attr('id', oGrid.id + '-row-' + rowIndex)
      .attr('data-row-index', rowIndex);
    var html = $clone.html();
    html = html.replace(/, row template/g, ', entry ' + (parseInt(rowIndex) + 1));
    html = html.replace(/displayRowNumber/g, (parseInt(rowIndex) + 1));
    html = html.replace(/template/g, rowIndex);
    $clone.html(html);
    $clone.insertBefore($template);

    //ADD THE PROPER DELETE FUNCTION TO THE DELETE ROW BUTTON FOR THE NEW ROW
    $clone.find('.grid-minus').click(function () {
      var $row = $(this).closest('tr');
      $.each($row.find('.form-control'), function (i, item) {
        var $item = $(item);
        var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name');
        $('#' + app.id).formValidation('removeField', itemId);
      });
      var focusEl = $row.prev().find('input,select,textarea').first();
      $row.remove();
      focusEl.focus();
    });

    //ADD EACH FIELD IN THE NEW GRID ROW TO THE FORM VALIDATOR
    var arrNewFields = $clone.find('.form-control');
    $.each(arrNewFields, function (i, item) {
      var $item = $(item);
      var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name'); //this looks like rows[x].name
      var definition = fieldDefinitions[itemId.split('.')[1]];
      var validatorOptions = app.validatorOptions(definition);
      app.addValidatorMessageDiv(definition, validatorOptions, $item.closest('td')[0], rowIndex);
      $('#' + app.id).formValidation('addField', itemId, validatorOptions);
    });
    app.initializePluginsInRow(row, $clone);
    app.fixFormValidationRender($clone);
    $clone.find('input,select,textarea').first().focus();
  };
  oBTN.appendChild(document.createElement('span')).className = 'glyphicon glyphicon-plus';
  var oSpan = oBTN.appendChild(document.createElement('span'));
  oSpan.textContent = ' Add Row to ' + row.title;
};

cot_form.prototype.processField = function (oRow, oVal, row, field) {
  var intFields = row.fields.length;
  var oField = oRow.appendChild(document.createElement('div'));
  oField.id = field.id + 'Element';
  oField.className = field['className'] || ((intFields == 1) ? "col-xs-12" : (intFields == 2) ? "col-xs-12 col-sm-6" : (intFields == 3) ? "col-xs-12 col-md-4" : "col-xs-12 col-sm-6 col-md-3");
  oField.className += ' form-group form-group-';
  oField.className += field.orientation || 'vertical';
  oField.className += field.addclass ? " " + field.addclass : '';
  var oFieldDiv = oField.appendChild(document.createElement('div'));

  //LABEL
  if (['html', 'button'].indexOf(field.type) == -1) {
    var useLabel = ['static', 'checkbox', 'radio', 'dropzone'].indexOf(field.type) === -1;
    if (useLabel || field.title) {
      var label = oFieldDiv.appendChild(document.createElement(useLabel ? 'label' : 'span'));
      label.className = useLabel ? 'control-label' : 'staticlabel' + (field.type != 'static' && field.type != 'dropzone' ? ' ' + field.type : '');
      if (useLabel) {
        label.htmlFor = field.id;
      } else {
        label.setAttribute('id', field.id + '_label');
      }

      var titleSpan = label.appendChild(document.createElement('span'));
      titleSpan.textContent = field.title;
      if (field.type === 'multiselect') {
        $(label).attr('id', field.id + '_label');
        $(titleSpan).append($('<span class="sr-only">:</span>'));
      }
      if (!field.required && field.type != 'static') {
        var optionalLabel = label.appendChild(document.createElement('span'));
        optionalLabel.className = 'optional';
        optionalLabel.textContent = '(optional)';
      }
      if (field.infohelp) {
        var tooltip = label.appendChild(document.createElement('span'));
        tooltip.className = 'glyphicon glyphicon-info-sign';
        tooltip.setAttribute('data-toggle', 'tooltip');
        tooltip.setAttribute('data-placement', 'top');
        tooltip.tabIndex = 0;
        tooltip.title = field.infohelp;
      }
    }
  }
  this.addprehelptext(field, oFieldDiv);
  this.addformfield(field, oFieldDiv);
  this.addposthelptext(field, oFieldDiv);
  this.addfieldvalidation(oVal, field, oFieldDiv);

};

cot_form.prototype.addprehelptext = function (fieldDefinition, fieldContainer) {
  if (fieldDefinition['prehelptext']) {
    var oHelp = fieldContainer.appendChild(document.createElement('p'));
    oHelp.className = 'helptext';
    oHelp.id = 'prehelptext_' + fieldDefinition.id;
    oHelp.innerHTML = fieldDefinition.prehelptext;
  }
};
cot_form.prototype.addformfield = function (fieldDefinition, fieldContainer) {
  fieldContainer.appendChild(this.callFunction(this[fieldDefinition.type + 'FieldRender'], fieldDefinition, fieldContainer));
  if (fieldDefinition['prehelptext']) {
    //this only works after the field is in the DOM
    this.updateDescribedBy(fieldContainer, 'prehelptext_' + fieldDefinition.id);
  }
};

cot_form.prototype.addposthelptext = function (fieldDefinition, fieldContainer) {
  if (fieldDefinition['posthelptext']) {
    var oHelp = fieldContainer.appendChild(document.createElement('p'));
    oHelp.className = 'helptext';
    oHelp.id = 'posthelptext_' + fieldDefinition.id;
    oHelp.innerHTML = fieldDefinition.posthelptext;
    this.updateDescribedBy(fieldContainer, oHelp.id);
  }
};

cot_form.prototype.validatorOptions = function (fieldDefinition) {
  var validators = {};
  // force field type =='phone'||'email' to have proper validationtype
  if (fieldDefinition['type'] === 'phone') {
    fieldDefinition.validationtype = 'Phone';
  } else if (fieldDefinition['type'] === 'email') {
    fieldDefinition.validationtype = 'Email';
  }

  if (fieldDefinition.required) {
    validators.notEmpty = {
      message: fieldDefinition['requiredMessage'] || (fieldDefinition.title + ' is required and cannot be left blank')
    };
  }

  if (fieldDefinition.type === "datetimepicker") {
    validators.callback = {
      message: fieldDefinition['validationMessage'] || ('The date must be in the format ' + fieldDefinition.options.format),
      callback: function (value) {
        return (value === '' && !fieldDefinition.required) || moment(value, fieldDefinition.options.format, true).isValid();
      }
    };
  } else if (fieldDefinition.type === "daterangepicker") {
    validators.callback = {
      message: fieldDefinition['validationMessage'] || ('The dates must be in the format ' + fieldDefinition.options.locale.format + fieldDefinition.options.locale.separator + fieldDefinition.options.locale.format),
      callback: function (value) {
        var dates = value.split(fieldDefinition.options.locale.separator);
        return (value === '' && !fieldDefinition.required) ||
          (dates.length === 2 &&
            moment(dates[0], fieldDefinition.options.locale.format, true).isValid() &&
            moment(dates[1], fieldDefinition.options.locale.format, true).isValid());
      }
    };
  }
  // else if (fieldDefinition.type === "phone") {
  //   validators.phone = {
  //     country: fieldDefinition.options.countryCode || 'US',
  //     message: fieldDefinition['validationMessage'] || 'This field must be a valid phone number.'
  //   };
  // }
  else {
    switch (fieldDefinition.validationtype) {
      case 'Phone':
        validators.callback = {
          message: fieldDefinition['validationMessage'] || 'This field must be a valid phone number.',
          callback: function (value, validator, $field) {
            if (IEversion < 10) {
              if (fieldDefinition.required || value !== "") {
                if (value.match(/\d{3}-?\d{3}-?\d{4}/) && value.match(/\d{3}-?\d{3}-?\d{4}/)[0] == value) {
                  $field.val(value.replace(/(\d{3})\-?(\d{3})\-?(\d{4})/, '$1-$2-$3'));
                  return true;
                } else {
                  return false;
                }
              } else {
                return true;
              }
            } else {
              return value === '' || $field.intlTelInput('isValidNumber');
            }
          }
        };
        break;
      case 'Email':
        validators.emailAddress = {
          message: fieldDefinition['validationMessage'] || 'The value is not a valid email address'
        };
        break;
      case 'URL':
        validators.uri = {
          message: fieldDefinition['validationMessage'] || 'The value is not a valid URL (http://xx.xx or https://xx.xx).'
        };
        break;
      case 'PostalCode':
        validators.regexp = {
          regexp: /^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$/i,
          message: fieldDefinition['validationMessage'] || 'This field must be a valid postal code'
        };
        break;
    }
  }
  var retVal = {
    validators: $.extend(validators, fieldDefinition['validators'] || {})
  };
  if (fieldDefinition.type == 'dropzone') {
    retVal.excluded = false;
  }
  return retVal;
};

cot_form.prototype.addfieldvalidation = function (formValidatorFields, fieldDefinition, fieldContainer) {
  //ADD VALIDATION
  var validatorOptions = this.validatorOptions(fieldDefinition);
  this.addValidatorMessageDiv(fieldDefinition, validatorOptions, fieldContainer, fieldDefinition['grid']);
  formValidatorFields.fields[fieldDefinition.id] = validatorOptions;
};

cot_form.prototype.addValidatorMessageDiv = function (fieldDefinition, validatorOptions, fieldContainer, gridRowIndex) {
  if (!$.isEmptyObject(validatorOptions.validators)) {
    var errorMessageDiv = fieldContainer.appendChild(document.createElement('div'));
    errorMessageDiv.id = 'fv_err_msg_' + Math.random().toString().split('.')[1] + '_' + (gridRowIndex || '');
    errorMessageDiv.className = 'fv-err-msg';
    this.updateDescribedBy(fieldContainer, errorMessageDiv.id);
    validatorOptions['err'] = '#' + errorMessageDiv.id;
  }
};

cot_form.prototype.updateDescribedBy = function (targetFieldContainer, fieldDescribedByElementId) {
  var $fields = $(targetFieldContainer).find('input,textarea,select');
  var currentValues = $fields.attr('aria-describedby') ? $fields.attr('aria-describedby').split(' ') : [];
  $fields.attr('aria-describedby', currentValues.concat([fieldDescribedByElementId]).join(' '));
};

cot_form.prototype.callFunction = function (func) {
  var ret = func.apply(this, Array.prototype.slice.call(arguments, 1));
  return ret;
};

cot_form.prototype.staticFieldRender = function (field, oLabel) {
  var o = document.createElement('p');
  o.name = (field.grid || "") ? "row[0]." + field.id : field.id;
  o.textContent = field.value;
  return o;
};

cot_form.prototype.htmlFieldRender = function (field, oLabel) {
  var o = document.createElement('div');
  o.name = (field.grid || "") ? "row[0]." + field.id : field.id;
  o.innerHTML = field.html;
  return o;
};

cot_form.prototype.textFieldRender = function (field, oLabel, typeOverride) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('input'));
  if (field['htmlAttr']) {
    $(oField).attr(field['htmlAttr']);
  }
  oField.title = field.title;
  oField.type = typeOverride || 'text';
  oField.value = (field.value || "") ? field.value : '';
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  if (field.grid || "") {
    var gridId = $(oField).closest('.grid-object').attr('id');
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
    var parent = $(oField).closest('.panel-info').find('h3').attr('id');
    if (parent) {
      oField.setAttribute('aria-labelledby', parent + ' ' + field.id);
    }
    //oField.setAttribute('aria-label',field.title);
  }
  //SET THE REQUIRED FIELD DECLARATVE FORM VALIDATION ATTRIBUTES
  if (field.required) {
    oField.setAttribute("aria-required", "true");
    oField.className = 'form-control required';
  } else {
    oField.className = 'form-control';
  }

  if (field.validationtype == "Phone" || typeOverride == 'tel') {
    oField.className += " phonevalidation ";
  }
  oField.placeholder = (field.placeholder || "") ? field.placeholder : "";

  return o;
};

cot_form.prototype.passwordFieldRender = function (field, oLabel) {
  return this.textFieldRender(field, oLabel, 'password');
};
cot_form.prototype.numberFieldRender = function (field, oLabel) {
  return this.textFieldRender(field, oLabel, 'number');
};
cot_form.prototype.emailFieldRender = function (field, oLabel) {
  return this.textFieldRender(field, oLabel, 'email');
};
cot_form.prototype.phoneFieldRender = function (field, oLabel) {
  return this.textFieldRender(field, oLabel, 'tel');
};
cot_form.prototype.hiddenFieldRender = function (field, oLabel, typeOverride) {
  var oField = oLabel.appendChild(document.createElement('input'));
  oField.type = typeOverride || 'hidden';
  oField.value = (field.val || "") ? field.val : '';
  oField.name = field.id;

  return oField;
};
cot_form.prototype.radioFieldRender = function (field) {
  var o = document.createElement('fieldset');
  o.className = 'form-control';
  var oLegend = o.appendChild(document.createElement('legend'));
  oLegend.className = "sr-only";
  oLegend.textContent = "Select an option for " + (field.title || field.id);

  $.each(field.choices, function (m, choice) {
    var oDiv = o.appendChild(document.createElement('label'));
    oDiv.className = (field.orientation || '') ? field.orientation : 'vertical';
    oDiv.className += ' entryField radioLabel';
    var oField = oDiv.appendChild(document.createElement('input'));
    if (field.grid || "") {
      oField.name = "row[" + field.grid + "]." + field.id;
    } else {
      oField.name = field.id;
      oField.id = field.id + '_' + m;
    }
    if (field['required']) {
      oField.setAttribute('aria-required', 'true');
    }
    oField.type = 'radio';
    oField.className = (field.required || "") ? 'required' : '';
    oField.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oField.disabled = (field.disabled || "") ? "disabled" : false;
    if (field.value || "") {
      oField.checked = (field.value == oField.value) ? 'checked' : '';
    }
    oDiv.appendChild(document.createElement('span')).innerHTML = choice.text;
  });

  return o;
};

cot_form.prototype.checkboxFieldRender = function (field) {
  var o = document.createElement(field.choices.length == 1 ? 'div' : 'fieldset');
  o.className = field.choices.length == 1 ? 'form-control form-control--div' : 'form-control';
  if (field.choices.length > 1) {
    var oLegend = o.appendChild(document.createElement('legend'));
    oLegend.className = "sr-only";
    oLegend.textContent = "Select options for " + (field.title || field.id);
  }

  $.each(field.choices, function (m, choice) {
    var oDiv = o.appendChild(document.createElement('label'));
    oDiv.className = (field.orientation || '') ? field.orientation : 'vertical';
    oDiv.className += ' entryField checkboxLabel';
    var oField = oDiv.appendChild(document.createElement('input'));
    if (field.grid || "") {
      oField.name = "row[" + field.grid + "]." + field.id;
    } else {
      oField.name = field.id;
      oField.id = field.id + '_' + m;
    }
    if (field['required']) {
      oField.setAttribute('aria-required', 'true');
    }
    oField.type = 'checkbox';
    oField.className = (field.required || "") ? 'required' : '';
    oField.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oField.disabled = (field.disabled || "") ? "disabled" : false;
    if (choice.selected || "") {
      oField.checked = "checked";
    }
    oDiv.appendChild(document.createElement('span')).innerHTML = choice.text;
  });

  return o;
};

cot_form.prototype.dropdownFieldRender = function (field, oLabel) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField dropdown-entry-field';
  var oField = o.appendChild(document.createElement('select'));
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  if (field.grid || "") {
    oField.name = "row[" + field.grid + "]." + field.id;
    var gridId = $(oField).closest('.grid-object').attr('id');
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.className = 'form-control';
  $.each(field.choices, function (m, choice) {
    var oOption = oField.appendChild(document.createElement('option'));
    oOption.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oOption.text = choice.text;
    if (field.value || "") {
      oOption.selected = (field.value == oOption.value) ? 'selected' : '';
    }
  });
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.multiselectFieldRender = function (field, oLabel) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('select'));
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  if (field.grid || "") {
    var gridId = $(oField).closest('.grid-object').attr('id');
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.style.display = 'none';
  oField.setAttribute('aria-hidden', true);
  oField.className = 'form-control multiselect ' + field.id;
  oField.multiple = field.multiple ? 'multiple' : '';
  $.each(field.choices, function (m, choice) {
    var oOption = oField.appendChild(document.createElement('option'));
    oOption.value = choice.hasOwnProperty('value') ? choice.value : choice.text;
    oOption.text = choice.text;
  });
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.daterangepickerFieldRender = function (field, oLabel) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('input'));
  if (field.grid || "") {
    var gridId = $(oField).closest('.grid-object').attr('id');
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.type = 'text';
  oField.value = (field.value || "") ? field.value : '';
  oField.className = (field.required || "") ? 'form-control required daterangevalidation' : 'form-control daterangevalidation';
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  oField.placeholder = field.placeholder || "";
  return o;
};

cot_form.prototype.datetimepickerFieldRender = function (field, oLabel) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'input-group date entryField datetimepicker ' + field.id;
  o.setAttribute("data-refid", field.id);
  var oField = o.appendChild(document.createElement('input'));
  oField.type = 'text';
  if (field['required']) {
    oField.setAttribute("aria-required", "true");
    oField.className = 'form-control required';
  } else {
    oField.className = 'form-control';
  }
  oField.value = field['value'] || '';
  if (field['grid']) {
    var gridId = $(oField).closest('.grid-object').attr('id');
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  oField.className = 'form-control';
  var oSpan = o.appendChild(document.createElement('span'));
  oSpan.className = 'input-group-addon';
  oSpan.setAttribute('aria-hidden', true);
  oSpan = oSpan.appendChild(document.createElement('span'));
  oSpan.className = 'glyphicon ' + (field['glyphicon'] || 'glyphicon-calendar');

  oField.disabled = field['disabled'] ? "disabled" : false;
  oField.placeholder = field.placeholder || "";
  return o;
};

cot_form.prototype.textareaFieldRender = function (field, oLabel) {
  var o = oLabel.appendChild(document.createElement('div'));
  o.className = 'entryField';
  var oField = o.appendChild(document.createElement('textarea'));
  if (field['htmlAttr']) {
    $(oField).attr(field['htmlAttr']);
  }
  if (field.grid || "") {
    var gridId = $(oField).closest('.grid-object').attr('id');
    oField.name = "row[" + field.grid + "]." + field.id;
    $(oField).attr("aria-labelledby", gridId + '_row_sr_label_' + field.grid + ' ' + field.gridlabel);
  } else {
    oField.name = field.id;
    oField.id = field.id;
  }
  if (field.cols) {
    oField.cols = field.cols;
  }
  if (field.rows) {
    oField.rows = field.rows;
  }
  oField.title = field.title;
  oField.type = 'text';
  oField.className += (field.required || "") ? 'form-control required' : 'form-control';
  if (field.required) {
    oField.setAttribute("aria-required", "true");
  }
  oField.placeholder = field.placeholder || "";
  oField.value = (field.value || "") ? field.value : '';
  oField.disabled = (field.disabled || "") ? "disabled" : false;
  return o;
};

cot_form.prototype.buttonFieldRender = function (field) {
  var o = document.createElement('button');
  o.type = 'button';
  if (field['className'] && !field['btnClass']) {
    //field['className'] should probably never have been applied here,
    //but to avoid a breaking change, we don't apply field['className'] if the newer field['btnClass'] is used
    o.className = field.className;
  } else {
    o.className = 'btn btn-' + (field['btnClass'] || 'success');
  }
  var oSpan = o.appendChild(document.createElement('span'));
  oSpan.className = (field.glyphicon || "") ? 'glyphicon ' + field.glyphicon : '';
  oSpan = o.appendChild(document.createElement('span'));
  oSpan.textContent = field.title;
  o.disabled = (field.disabled || "") ? "disabled" : false;
  $(o).on('click', field['onclick'] || function () { });
  return o;
};

cot_form.prototype.dropzoneFieldRender = function (field) {
  const el = document.createElement('div');

  const hiddenInput = document.createElement('input');
  hiddenInput.setAttribute('type', 'hidden');
  hiddenInput.setAttribute('data-fv-field', field.id);
  hiddenInput.setAttribute('id', field.id);
  hiddenInput.setAttribute('name', field.id);

  if (field.required) {
    hiddenInput.setAttribute('aria-required', true);
    hiddenInput.classList.add('required');
  }

  el.appendChild(hiddenInput);

  // ---------------------------------------------------------------------------

  const dropzoneElement = document.createElement('div');
  dropzoneElement.classList.add('dz-form-field');
  el.appendChild(dropzoneElement);

  field.options.selector = dropzoneElement;

  const cotDropzone = hiddenInput.cotDropzone = new CotDropzone();

  // ---------------------------------------------------------------------------

  field.validators = field.validators || {};
  field.validators.callback = {
    callback: function (value, validator, $field) {
      const hasError = cotDropzone.dropzone.files.some((file) => file.status === Dropzone.ERROR);
      if (hasError) {
        return {
          message: `File upload cannot contain any errors.`,
          valid: false
        }
      }

      return { valid: true }
    }
  };

  // ---------------------------------------------------------------------------

  function updateHiddenInput() {
    // $(cotDropzone.dropzone.element).closest('form').data('formValidation').revalidateField(field.id);

    // let value = cotDropzone.dropzone.files.filter((file) => {
    //   return file.status === Dropzone.SUCCESS || file.status === Dropzone.ADDED;
    // });

    let value = cotDropzone.dropzone.files;

    if (typeof field.options.valueMapFromFiles === 'function') {
      value = value.map(field.options.valueMapFromFiles);
    } else if (typeof field.options.valueMap === 'function') {
      value = value.map(field.options.valueMap);
    }

    const $hiddenInput = $(hiddenInput);
    const textValue = value.length > 0 ? JSON.stringify(value) : '';
    if (textValue != $hiddenInput.val()) {
      $hiddenInput.val(textValue).trigger('change');
      if ($hiddenInput.closest('form').data('formValidation') != null) {
        $hiddenInput.closest('form').data('formValidation').revalidateField($hiddenInput);
      }
    }
  };

  // ---------------------------------------------------------------------------

  cotDropzone._fillFromModel = function (model) {
    if (field.bindTo) {
      cotDropzone.dropzone.removeAllFiles(true);

      let files = cotDropzone.initFiles = model.get(field.bindTo) || [];

      if (typeof files === 'string') {
        try {
          files = JSON.parse(files);
          if (!Array.isArray(files)) {
            files = [];
          }
        } catch (e) {
          files = [];
        }
      }

      if (!Array.isArray(files)) {
        files = [files];
      }

      for (var i = 0, l = files.length; i < l; i++) {
        files[i].size = +files[i].size;
        if (isNaN(files.size)) {
          files.size = -1;
        }
      }

      if (typeof field.options.valueMapToFiles === 'function') {
        files = files.map(field.options.valueMapToFiles);
      }

      cotDropzone.addInitialFiles(...files);
    }
  };

  // ---------------------------------------------------------------------------

  cotDropzone._watchChanges = function (form) {
    if (field.bindTo) {
      $(hiddenInput).on('change', function (e) {
        if (form._model != null) {
          let newValue = cotDropzone.dropzone.files;
          // .filter((file) => {
          //   return file.status === Dropzone.SUCCESS || file.status === Dropzone.ADDED;
          // });

          if (typeof field.options.valueMapFromFiles === 'function') {
            newValue = newValue.map(field.options.valueMapFromFiles);
          } else if (typeof field.options.valueMap === 'function') {
            newValue = newValue.map(field.options.valueMap);
          }

          if (field.excludeDeleted !== true && cotDropzone.dropzone.deletedFiles) {
            let deletedValue;

            if (typeof field.options.valueMapFromFiles === 'function') {
              deletedValue = cotDropzone.dropzone.deletedFiles.map(field.options.valueMapFromFiles);
            } else if (typeof field.options.valueMap === 'function') {
              deletedValue = cotDropzone.dropzone.deletedFiles.map(field.options.valueMap);
            }

            newValue = newValue.concat(deletedValue);
          }

          form._model.set(field.bindTo, newValue);
          form._model.trigger('change');
        }
      });
    }
  };

  // ---------------------------------------------------------------------------

  cotDropzone.uploadAndCallback = function (cbk) {
    var step2 = function () {
      if (cbk) {
        cbk({
          delete: cotDropzone.dropzone.deletedFiles || [],
          keep: cotDropzone.dropzone.files.filter((file) => {
            return file.status === Dropzone.SUCCESS && file.xhr != null
          })
        });
      }
    };
    var step1 = function () {
      var success = function () {
        cotDropzone.dropzone.off('queuecomplete', success);
        step1();
      };

      const filesToUpload = cotDropzone.dropzone.files.filter((file) => file.accepted === true && file.status === Dropzone.ADDED);
      if (filesToUpload.length > 0) {
        cotDropzone.dropzone.on('queuecomplete', success);
        cotDropzone.dropzone.enqueueFiles(filesToUpload);
      } else {
        step2();
      }
    };
    step1();
  };

  this.success = ((success) => function (event) {
    event.preventDefault();

    function queuecomplete() {
      // cotDropzone.dropzone.off('queuecomplete', queuecomplete);
      // if (field.allowFormsubmitionWithUploadError !== false || cotDropzone.dropzone.files.filter((file) => file.status === Dropzone.ERROR).length === 0) {
      if (field.allowFormsubmitionWithUploadError === true || cotDropzone.dropzone.files.filter((file) => file.status === Dropzone.ERROR).length === 0) {
        if (success != null) {
          return success(event);
        }
      }
    };

    // const filesToUpload = cotDropzone.dropzone.files.filter((file) => file.accepted === true && file.status === Dropzone.ADDED);
    // if (filesToUpload.length > 0) {
    //   cotDropzone.dropzone.on('queuecomplete', queuecomplete);
    //   cotDropzone.dropzone.enqueueFiles(filesToUpload);
    // } else {
    //   queuecomplete();
    // }
    cotDropzone.uploadAndCallback(queuecomplete);

    return false;
  })(this.success);

  // ---------------------------------------------------------------------------

  let presetInit;

  if (field.options.preset != null) {
    let preset = field.options.preset;
    if (typeof preset === 'string') {
      preset = CotDropzone.presets[preset];
    }
    if (preset != null && preset.init != null) {
      presetInit = preset.init;
    }
  }

  if (presetInit == null && CotDropzone.defaultOptions != null && CotDropzone.defaultOptions.preset != null) {
    let preset = CotDropzone.defaultOptions.preset;
    if (typeof preset === 'string') {
      preset = CotDropzone.presets[preset];
    }
    if (preset != null && preset.init != null) {
      presetInit = preset.init;
    }
  }

  field.options.init = CotDropzone.mergeFunctions(presetInit, field.options.init, function () {
    this.on('addedfile', function (file) {
      updateHiddenInput();
    });

    this.on('queuecomplete', function () {
      updateHiddenInput();
    });

    this.on('removedfile', function (file) {
      updateHiddenInput();
    });

    this.on('error', function (file) {
      updateHiddenInput();
    });

    this.options.onFieldChange = CotDropzone.mergeFunctions(this.options.onFieldChange, function () {
      updateHiddenInput();
    })
  });

  // ---------------------------------------------------------------------------

  cotDropzone.render(field.options);
  // $('.btn-addFiles', el).attr('aria-labelledby', field.id + '_label');
  if (typeof field.title === 'string') {
    $('.btn-addFiles', el).append(` <span class="sr-only">for ${field.title}</span>`);
  }

  return el;
};

/*
 CotForm is a class to supercede and wrap around cot_form.
 Example usage:
 var f = new CotForm(def); //see below about the def argument
 var app = new cot_app('my app');
 app.addForm(f, 'bottom');

 definition: a complete raw javascript object that defines a cot_form. ex:
 {
   //these first four are the same as the properties passed to new cot_form()
   id: 'my_form_id',
   title: 'My Form',
   rootPath: '/resources/my_app/', //only required when using any validationtype=Phone fields
   success: someFunctionDefinedSomewhereElse,

   useBinding: true, //defaults to false, set to true to use data binding with a CotModel object.
   //use in conjunction with the setModel method of CotForm and the bindTo attribute of field definitions

   sections: [ //an array of sections on the form
     {
       //these first three are the same as the properties passed to new cot_section()
       id: 'section_one',
       title: 'Section One',
       className: 'Some special class'

       rows: [ //an array of rows within the current section
         { //for each row, specify a grid OR an array of fields:
           fields: [ //an array of fields within the current row
             {
               type: '', //optional, enum: ['number','email', 'phone', 'hidden','html', 'button', 'static', 'checkbox', 'radio', 'text' (default), 'daterangepicker', 'dropdown', 'multiselect', 'datetimepicker', 'textarea', 'password'], the type of field to add to the row
               // NOTE: if type:'phone' or type:'email', validationtype is not necessaty anmymore, it will be added automatically
               id: 'field_one', //required, used to create the dom element id
               title: '', //required except for type=html|button|static, the title/label for the field
               className: 'col-xs-6', //optional, override the auto-generated css grid col classes, ex: col-xs-12
               //NOTE: if type=button, className is applied to button as well. if you DO NOT want this behaviour, you can explicitly specify the btnClass option below
               btnClass: 'success', //optional, only applies when type=button, defaults to 'success', determines the bootstrap btn-x class used to style the button, valid values are here: http://getbootstrap.com/css/#buttons-options
               orientation: 'horizontal', //optional, enum: ['horizontal','vertical']. default is vertical. this affects fields like radio
               addclass: 'additional-class', //optional, append to the auto-generated classes
               required: false, //optional, defaults to false
               requiredMessage: '', //optional, if required is set to true, this is used as the empty error message (instead of the default)
               infohelp: '', //optional, help text for the field, which is shown via a tooltip for an info icon, does not apply to type=html||button
               prehelptext: '', //optional, help text for the field which is always displayed, in front of the field
               posthelptext: '', //optional, help text for the field which is always displayed, after the field
               validators: {}, //optional, a validator object. see: http://formvalidation.io/validators/, ex: validators: {creditCard: {message: 'Invalid cc value'}}
                                //when required is true or validationtype is used or type is set to daterangepicker||datetimepicker, validators are auto-generated for you,
                                //but any validators that you specify here will override the auto-generated ones
               validationtype: 'Phone', //optional, enum: ['Phone', 'Email', 'URL','PostalCode'], if specified, this will automatically set the proper validators object
               //NOTE: if type:'phone' or type:'email' then validationtype is not necessary
               validationMessage: '', //optional, when validationtype is used or type is set to daterangepicker||datetimepicker, this can be specified to override the default error message
               options: {}, //optional, a raw javascript object,
                //when type=daterangepicker||multiselect||datetimepicker OR validationtype=Phone, this is passed into the jquery constructor for the field
                //see http://davidstutz.github.io/bootstrap-multiselect/
                //see http://www.daterangepicker.com/
                //see http://eonasdan.github.io/bootstrap-datetimepicker/
                //see https://github.com/jackocnr/intl-tel-input/tree/v7.1.0#options
               value: '', //optional, the value or content of this field
               html: '', //optional, the html content, only applies when type=html
               disabled: false, //optional, defaults to false, only applies to fields that can be disabled
               placeholder: '', //optional, a placeholder string for input fields, doesn't apply if validationtype=Phone
               choices: [{text: '', value: ''}], //required when type=radio||checkbox||dropdown||multiselect, an array of text/value pairs, text is required, but value is not (defaults to text)
               multiple: false, //optional, defaults to false, only applies when type=multiselect, determines if multiple selection is allowed
               cols: '50', //optional, when type=textarea this specifies the cols attribute
               rows: '10', //optional, when type=textarea this specifies the rows attribute
               glyphicon: '', //optional, a glyphicon class (ex: glyphicon-minus), when type=button this can be set to add an icon to the button, when type=datetimepicker this can be set to override the default calendar icon
               onclick: function(){}, //optional, when type=button this specifies an onclick function
               htmlAttr: {}, //optional, when type=text||password||textarea this can be used to pass a set of html attributes, which will be set on the input element using jquery's attr method
               bindTo: 'fieldname' //this is only available when using CotForm, specify the name or path of a field to bind to, this is not supported if type is 'html', 'button', or 'static'
             }
           ]
         },
         {
          grid: {
             id: 'grid', //an id for the grid
             add: true, //appears to not be in use
             title: 'grid title', //a title for the grid
             headers: [ //an array of objects with title values, for the grid column headings
               {title: 'Heading 1'},
               {title: 'Heading 2'}
             ],
             fields: [ //an array of fields within the current grid
               {
                //the other properties in here are the same as the ones as listed just above
               }
             ]
           }
         }
       ]
     }
   ]
 }
 */
function CotForm(definition) {
  if (!definition) {
    throw new Error('You must supply a form definition');
  }
  this._isRendered = false;
  this._definition = definition;
  this._useBinding = definition['useBinding'] || false;
  this._model = null;
  this.cotForm = new cot_form({
    id: definition['id'] || 'new_form',
    title: definition['title'],
    rootPath: definition['rootPath'],
    success: definition['success'] || function () { }
  });
  this.cotForm._cotForm = this;
  var that = this;
  var bindableTypes = ['text', 'number', 'phone', 'email', 'hidden', 'dropdown', 'textarea', 'checkbox', 'radio', 'password', 'multiselect', 'datetimepicker', 'daterangepicker', 'dropzone'];
  $.each(definition['sections'] || [], function (i, sectionInfo) {
    var section = that.cotForm.addSection({
      id: sectionInfo['id'] || 'section' + i,
      title: sectionInfo['title'],
      className: sectionInfo['className'],
      readSectionName: sectionInfo['readSectionName']
    });
    $.each(sectionInfo['rows'] || [], function (y, row) {
      if (row['fields']) {
        row['fields'].forEach(function (field) {
          var type = field['type'] || 'text';
          if (field['bindTo'] && bindableTypes.indexOf(type) === -1) {
            throw new Error('Error in field ' + (field['id'] || 'no id') + ', fields of type ' + type + ' cannot use bindTo.');
          }
        });
        section.addRow(row['fields']);
      } else if (row['grid']) {
        section.addGrid(row['grid']);
      } else if (row['repeatControl']) {
        section.addRepeatControl(row['repeatControl']);
      }
    });
  });
}

CotForm.prototype.render = function (options) {
  //options can be a string OR an object:
  //string: a css selector string of an element to append the form to, ex: '#my_form_container'
  //object: {
  //target: '#element_id', //required. a css selector string of an element to append the form to, ex: '#my_form_container'
  //formValidationSettings: {} //optional, when specified, the attributes in here are passed through to the formValidation constructor: http://formvalidation.io/settings/
  //}
  if (this._isRendered) {
    throw new Error('This form is already rendered');
  }
  if (typeof options == 'string') {
    options = {
      target: options
    };
  }
  this.cotForm.render(options);
  this._isRendered = true;
  if (this._useBinding) {
    if (this._model) {
      this._fillFromModel(this._model);
    }
    this._watchChanges();
  }
};

CotForm.prototype.setModel = function (object) {
  if (object && typeof object['get'] !== 'function') {
    throw new Error('Model must be a CotModel object');
  }
  this._model = null;
  this._fillFromModel(object);
  this._model = object;
  // this._model = object;
  // this._fillFromModel(object);
};

CotForm.prototype._fillFromModel = function (model) {

  // Common way to set field values
  function setFieldValue($fld, def, model) {
    var val = model.get(def.bindTo);

    if (val == null) {
      return;
    }

    switch (def.type) {
      case 'radio':
      case 'checkbox':
        val = Array.isArray(val) ? val : [val];
        var sel = val.map(function (itm, i, arr) {
          return '[value="' + itm + '"]';
        }).join(',');
        $fld.filter(sel).prop('checked', true);
        break;

      case 'phone':
        $fld.intlTelInput("setNumber", val)
        break;

      case 'multiselect':
        val = Array.isArray(val) ? val : [val];
        $fld.multiselect('select', val);
        break;

      case 'datetimepicker':
        $fld.closest('.datetimepicker').data('DateTimePicker').date(val || '');
        break;

      case 'daterangepicker':
        var picker = $fld.data('daterangepicker');
        if (val.indexOf(picker.locale.separator) > -1) {
          var dates = val.split(picker.locale.separator);
          picker.setStartDate(dates[0]);
          picker.setEndDate(dates[1]);
        }
        break;

      case 'dropzone':
        var dz = $fld.get(0);
        if (dz && dz.cotDropzone) {
          dz.cotDropzone._fillFromModel(model);
        }
        break;

      default:
        $fld.val(val);
        break;
    }
  }

  if (this._isRendered) {
    var sections = this._definition['sections'] || [];
    var sl = sections.length;
    for (var si = 0; si < sl; si++) {

      var rows = sections[si].rows;
      var rl = rows.length;
      for (var ri = 0; ri < rl; ri++) {
        if (rows[ri].fields) {
          // Fields.

          var fields = rows[ri].fields;
          var fl = fields.length;
          for (var fi = 0; fi < fl; fi++) {
            var field = fields[fi];
            if (!field.bindTo) {
              continue;
            }

            setFieldValue($('[name="' + field.id + '"]'), field, model);
          }
        } else if (rows[ri].grid && rows[ri].grid.bindTo) {
          // Grid.

          var bindTo = rows[ri].grid.bindTo;

          // If attribute does not exist.
          if (!model.get(bindTo)) {
            model.set(bindTo, new CotCollection());
          }

          // Get default value.
          var modelInit = CotForm._getModelInitValue(rows[ri].grid);

          // If attribute is not a collection.
          // Probably an array.
          if (!model.get(bindTo).models) {
            var arr = model.get(bindTo);
            var arrLength = arr.length;
            for (var i = 0; i < arrLength; i++) {
              arr[i] = $.extend({}, modelInit, arr[i]);
            }
            model.set(bindTo, new CotCollection(arr));
          }

          // Must contain 1 row.
          if (model.get(bindTo).models.length == 0) {
            model.get(bindTo).push(new CotModel(modelInit));
          }

          // Reset grid rows.
          $('#' + rows[ri].grid.id + ' [data-row-index]').not('[data-row-index="0"]').remove();
          this.cotForm[rows[ri].grid.id + '-index'] = 0;

          var models = model.get(bindTo).models;
          var ml = models.length;
          for (var mi = 0; mi < ml; mi++) {

            // Add new row.
            if (mi > 0) {
              $('#' + rows[ri].grid.id + ' button.grid-add').trigger('click');
            }

            var fields = rows[ri].grid.fields;
            var fl = fields.length;
            for (var fi = 0; fi < fl; fi++) {
              var field = fields[fi];
              if (!field.bindTo) {
                continue;
              }

              setFieldValue($('[name="row[' + mi + '].' + field.id + '"]'), field, models[mi])
            }
          }
        } else if (rows[ri].repeatControl && rows[ri].repeatControl.bindTo) {
          // Repeat control.

          var bindTo = rows[ri].repeatControl.bindTo;

          // If attribute does not exist.
          if (!model.has(bindTo)) {
            model.set(bindTo, new CotCollection());
          }

          // TODO - Look into this.
          // Get default value.
          var modelInit = {};

          // If attribute is not a collection.
          // Probably an array.
          if (!model.get(bindTo).models) {
            var arr = model.get(bindTo);
            model.set(bindTo, new CotCollection(arr));
          }

          // Reset grid rows.
          $('#' + rows[ri].repeatControl.id)[0].removeRows();

          var btnLength = $('.repeatControl-sets .repeatControl-set .repeatControl-set-button .btn', $('#' + rows[ri].repeatControl.id)).length;

          var models = model.get(bindTo).models;
          var ml = models.length;
          for (var mi = 0; mi < ml; mi++) {
            if (mi + 1 > btnLength) {
              // $('#' + rows[ri].repeatControl.id + ' .repeatControl-button .btn').trigger('click');
              $('#' + rows[ri].repeatControl.id)[0].addRow();
            }

            var id = rows[ri].repeatControl.id;
            var rows2 = rows[ri].repeatControl.rows;
            var r2l = rows2.length;
            for (var r2i = 0; r2i < r2l; r2i++) {
              if (rows2[r2i].fields) {
                var fields = rows2[r2i].fields;
                var fl = fields.length;
                for (var fi = 0; fi < fl; fi++) {
                  var field = fields[fi];
                  if (!field.bindTo) {
                    continue;
                  }
                  setFieldValue($('[name="' + id + '_' + mi + '_' + field.id + '"]'), field, models[mi])
                }
              } else if (rows2[r2i].grid) {
                var bindTo = rows2[r2i].grid.bindTo;
                var modelG = models[mi];

                // If attribute does not exist.
                if (!modelG.get(bindTo)) {
                  modelG.set(bindTo, new CotCollection());
                }

                // Get default value.
                var modelInit = CotForm._getModelInitValue(rows2[r2i].grid);

                // If attribute is not a collection.
                // Probably an array.
                if (!modelG.get(bindTo).models) {
                  var arr = modelG.get(bindTo);
                  var arrLength = arr.length;
                  for (var i = 0; i < arrLength; i++) {
                    arr[i] = $.extend({}, modelInit, arr[i]);
                  }
                  modelG.set(bindTo, new CotCollection(arr));
                }

                // Must contain 1 row.
                if (modelG.get(bindTo).models.length == 0) {
                  modelG.get(bindTo).push(new CotModel(modelInit));
                }

                // Reset grid rows.

                var gridId = rows2[r2i].grid.id.replace('___idx___', '_' + mi + '_');
                $('#' + gridId + ' [data-row-index]').not('[data-row-index="0"]').remove();
                this.cotForm[gridId + '-index'] = 0;

                var modelGs = modelG.get(bindTo).models;
                var mlG = modelGs.length;
                for (var miG = 0; miG < mlG; miG++) {

                  // Add new row.
                  if (miG > 0) {
                    $('#' + gridId + ' button.grid-add').trigger('click');
                  }

                  var fields = rows2[r2i].grid.fields;
                  var fl = fields.length;
                  for (var fi = 0; fi < fl; fi++) {
                    var field = fields[fi];
                    if (!field.bindTo) {
                      continue;
                    }
                    var fieldId = field.id.replace('___idx___', '_' + mi + '_');
                    var $field = $('[name="row[' + miG + '].' + fieldId + '"]');
                    setFieldValue($field, field, modelGs[miG])
                  }
                }
              }
            }
          }

          // Ensure the same number of model as rows.
          for (var mi = ml; mi < btnLength; mi++) {
            model.get(bindTo).push(new CotModel());
          }
        }
      }
    }
  }
};

CotForm.prototype._setupField = function ($fld, def, bindTo) {
  if (def.bindTo) {
    var form = this;

    switch (def.type) {
      case 'radio':
        $fld.on('click', function (e) {
          if (form._model) {
            var model = form._model;
            if (bindTo) {
              var bindToSplit = bindTo.split(/[\[\]\.]/);
              var bl = bindToSplit.length;
              for (var bi = 0; bi < bl; bi++) {
                if (bindToSplit[bi] != null && bindToSplit[bi] != '') {
                  if (model instanceof Backbone.Model) {
                    model = model.get(bindToSplit[bi]);
                  } else if (model instanceof Backbone.Collection) {
                    model = model.at(+bindToSplit[bi]);
                  }
                }
              }
            }
            model.set(def.bindTo, $(e.currentTarget).val());
          }
        });
        break;

      case 'checkbox':
        $fld.on('click', function (e) {
          if (form._model) {
            var values = [];
            $.each($fld.filter(':checked'), function () {
              values.push($(this).val())
            });

            var model = form._model;
            if (bindTo) {
              var bindToSplit = bindTo.split(/[\[\]\.]/);
              var bl = bindToSplit.length;
              for (var bi = 0; bi < bl; bi++) {
                if (bindToSplit[bi] != null && bindToSplit[bi] != '') {
                  if (model instanceof Backbone.Model) {
                    model = model.get(bindToSplit[bi]);
                  } else if (model instanceof Backbone.Collection) {
                    model = model.at(+bindToSplit[bi]);
                  }
                }
              }
            }
            model.set(def.bindTo, values);
          }
        });
        break;

      case 'multiselect':
        $fld.on('change', function (e) {
          if (form._model) {
            var model = form._model;
            if (bindTo) {
              var bindToSplit = bindTo.split(/[\[\]\.]/);
              var bl = bindToSplit.length;
              for (var bi = 0; bi < bl; bi++) {
                if (bindToSplit[bi] != null && bindToSplit[bi] != '') {
                  if (model instanceof Backbone.Model) {
                    model = model.get(bindToSplit[bi]);
                  } else if (model instanceof Backbone.Collection) {
                    model = model.at(+bindToSplit[bi]);
                  }
                }
              }
            }
            model.set(def.bindTo, $fld.val());
          }
        });
        break;

      case 'datetimepicker':
        $fld.closest('.datetimepicker').on('dp.change', function () {
          if (form._model) {
            var model = form._model;
            if (bindTo) {
              var bindToSplit = bindTo.split(/[\[\]\.]/);
              var bl = bindToSplit.length;
              for (var bi = 0; bi < bl; bi++) {
                if (bindToSplit[bi] != null && bindToSplit[bi] != '') {
                  if (model instanceof Backbone.Model) {
                    model = model.get(bindToSplit[bi]);
                  } else if (model instanceof Backbone.Collection) {
                    model = model.at(+bindToSplit[bi]);
                  }
                }
              }
            }
            model.set(def.bindTo, $fld.val());
          }
        });
        break;

      // case 'daterangepicker':
      // break;

      case 'dropzone':
        var dz = $fld.get(0);
        if (dz && dz.cotDropzone) {
          dz.cotDropzone._watchChanges(form); // TODO - Look into this.
        }
        break;

      default:
        $fld.on('change', function (e) {
          if (form._model) {
            var model = form._model;
            if (bindTo) {
              var bindToSplit = bindTo.split(/[\[\]\.]/);
              var bl = bindToSplit.length;
              for (var bi = 0; bi < bl; bi++) {
                if (bindToSplit[bi] != null && bindToSplit[bi] != '') {
                  if (model instanceof Backbone.Model) {
                    model = model.get(bindToSplit[bi]);
                  } else if (model instanceof Backbone.Collection) {
                    model = model.at(+bindToSplit[bi]);
                  }
                }
              }
            }
            model.set(def.bindTo, $fld.val())
          }
        });
        break;
    }
  }
}

CotForm.prototype._watchChanges = function () {
  var form = this;

  function setupField($fld, def, bindTo) {
    form._setupField($fld, def, bindTo);
  }

  if (this._isRendered) {
    var sections = this._definition.sections || [];
    var sl = sections.length;

    for (var si = 0; si < sl; si++) {
      var rows = sections[si].rows;
      var rl = rows.length;

      for (var ri = 0; ri < rl; ri++) {

        if (rows[ri].fields) {
          // Fields.

          var fields = rows[ri].fields;
          var fl = fields.length;
          for (var fi = 0; fi < fl; fi++) {
            var field = fields[fi];
            setupField($('[name="' + field.id + '"]'), field);
          }
        } else if (rows[ri].grid) {
          // Grid.

          var fields = rows[ri].grid.fields;
          var fl = fields.length;
          for (var fi = 0; fi < fl; fi++) {
            var field = fields[fi];
            $('[name$=".' + field.id + '"]').each(function (i, value) {
              setupField($(this), field, rows[ri].grid.bindTo + '[' + i + ']');
            });
          }

          // Initial CotModel value
          var modelInit = CotForm._getModelInitValue(rows[ri].grid);

          // Add button
          var addButton = $('#' + rows[ri].grid.id + ' button.grid-add').get(0);
          addButton.onclick = (function (oldOnClick, gridDef) {
            return function (e) {
              oldOnClick(e);


              var $newRow = $('#' + gridDef.id + ' [data-row-index]:last');

              // Remove button
              var $minButton = $('button.grid-minus', $newRow);
              $minButton.off('click').on('click', function (e) {
                var $gridRows = $('#' + gridDef.id + ' [data-row-index]');
                var $currentRow = $(this).closest('[data-row-index]');
                var idx = $gridRows.index($currentRow);

                if (form._model && form._model.get(gridDef.bindTo)) {
                  var collection = form._model.get(gridDef.bindTo);
                  if (collection && collection.models) {
                    collection.remove(collection.models[idx]);
                  }
                }

                // ORIGINAL CODE
                var $row = $(this).closest('tr');
                $.each($row.find('.form-control'), function (i, item) {
                  var $item = $(item);
                  var itemId = item.tagName.toUpperCase() === 'FIELDSET' ? $item.find('input').first().attr('name') : $item.attr('name');
                  $('#' + form.id).formValidation('removeField', itemId);
                });
                var focusEl = $row.prev().find('input,select,textarea').first();
                $row.remove();
                focusEl.focus();
              });

              if (form._model && form._model.get(gridDef.bindTo)) {
                var collection = form._model.get(gridDef.bindTo);
                if (collection) {
                  collection.push(new CotModel(modelInit));
                }
              }
              var prefixIdx = +$newRow.attr('data-row-index');
              var prefix = 'row[' + prefixIdx + '].';
              (gridDef['fields'] || []).forEach(function (field) {
                setupField($('[name="' + prefix + field.id + '"]'), field, gridDef.bindTo + '[' + prefixIdx + ']');
              });
            }
          })(addButton.onclick, rows[ri].grid);

        } else if (rows[ri].repeatControl) {
          // Repeat control.
          // $('#' + rows[ri].repeatControl.id)[0].setCotForm(this);
          // removeBtnOnClick
        }
      }
    }
  }
}

/*
 A convenience method to get all of the current form data as a javascript object,
 where each key is the name of the field and each value is the value

 */
CotForm.prototype.getData = function () {
  var data = {};
  var $form = $('#' + this.cotForm.id);
  $form.find('input[name], textarea[name], select[name]').each(function (i, fld) {
    var updateObject = data;
    var fieldName = fld.name;
    var fieldValue = null;
    if (fld.name.indexOf('row[') !== -1) {
      var sRowIndex = fld.name.substring(fld.name.indexOf('[') + 1, fld.name.indexOf(']'));
      if (sRowIndex !== 'template') {
        var gridId = $(fld).closest('.grid-object').attr('id');
        if (data[gridId] === undefined) {
          data[gridId] = [];
        }
        var iRowIndex = parseInt(sRowIndex);
        if (data[gridId][iRowIndex] === undefined) {
          data[gridId][iRowIndex] = {};
        }
        updateObject = data[gridId][iRowIndex];
        fieldName = fld.name.split('.')[1];
      } else {
        updateObject = null;
      }
    }
    if (updateObject) {
      switch (fld.tagName.toLowerCase()) {
        case 'input':
          switch (fld.type) {
            case 'text':
            case 'password':
            case 'email':
            case 'number':
              fieldValue = $(fld).val();
              break;
            case 'tel':
              fieldValue = $(fld).intlTelInput("getNumber");
              break;
            case 'checkbox':
              fieldValue = fld.checked ? $(fld).val() : null;
              if (updateObject[fieldName] === undefined) {
                fieldValue = fieldValue === null ? [] : [fieldValue] //make sure checkbox values are always arrays
              } else if (fieldValue === null) {
                updateObject = null; //don't add nulls to the value of arrays
              }
              break;
            case 'radio':
              fieldValue = fld.checked ? $(fld).val() : null;
              if (updateObject[fieldName] === null) {
                delete updateObject[fieldName]; //overwrite null values with selected values
              } else if (updateObject[fieldName] !== undefined) {
                updateObject = null; //don't overwrite selected values with null values
              }
              break;
            default:
              updateObject = null;
              break;
          }
          break;
        case 'textarea':
          fieldValue = $(fld).val();
          break;
        case 'select':
          if (fld.multiple) {
            var v = $(fld).val();
            fieldValue = v === null ? [] : v; //always use arrays for select multiple=true
          } else {
            fieldValue = $(fld).val();
          }
          break;
        default:
          updateObject = null;
          break;
      }
    }
    if (updateObject) {
      if (updateObject.hasOwnProperty(fieldName)) {
        updateObject[fieldName] = $.makeArray(updateObject[fieldName]);
        if ($.isArray(fieldValue)) {
          updateObject[fieldName] = updateObject[fieldName].concat(fieldValue);
        } else {
          updateObject[fieldName].push(fieldValue);
        }
      } else {
        updateObject[fieldName] = fieldValue;
      }
    }
  });
  return data;
};

CotForm._getModelInitValue = function (gridDef) {
  var modelInit = {};
  for (var i = 0, l = gridDef.fields.length; i < l; i++) {
    var field = gridDef.fields[i];
    if (field.bindTo) {
      if (field.type === 'checkbox' || (field.type === 'multiselect' && field.multiple === true)) {
        modelInit[field.bindTo] = [];
      }
      if (field.type === 'radio') {
        modelInit[field.bindTo] = null;
      } else {
        modelInit[field.bindTo] = '';
      }
    }
  }
  return modelInit;
};
