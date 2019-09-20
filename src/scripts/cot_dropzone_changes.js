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


CotDropzone.presets.common.init = function () {
  this.deletedFiles = [];

  this.on('addedfile', function (file) {
      file.isExcess = false;
      setTimeout(() => { this.options.announce.call(this, file.name + ' added.'); }, 1000);
      // this.options.announce.call(this, file.name + ' added.');
  });

  this.on('removedfile', (file) => {
      if (file.status === Dropzone.SUCCESS) {
          file.status = 'deleted';
          this.deletedFiles.push(file);
      }
      this.options.announce.call(this, file.name + ' removed.');
  });

  this.on('canceled', function (file) {
      if (this.options.announce == null) {
          return;
      }
      this.options.announce.call(this, file.name + ' upload canceled.');
  });

  this.on('error', function (file, errorMessage, xhr) {
      if (xhr != null) {
          file.errorType = 'uploaderror';
      }
      file.errorMessage = errorMessage;

      if (this.options.announce == null) {
          return;
      }
      this.options.announce.call(this, 'An error occured. ' + errorMessage);
  });

  this.on('maxfilesreached', function (file) {
      if (this.options.announce == null) {
          return;
      }
      this.options.announce.call(this, 'Maximum number of files reached.');
  });

  this.on('maxfilesexceeded', function (file) {
      file.isExcess = true;

      if (this.options.announce == null) {
          return;
      }
      this.options.announce.call(this, 'Maximum number of files exceeded.');
  });

  this.on('sending', function (file) {
      if (this.options.announce == null) {
          return;
      }
      this.options.announce.call(this, 'Uploading file ' + file.name + '.');
  });

  this.on('success', function (file) {
      if (this.options.announce != null) {
          return;
      }
      this.options.announce.call(this, file.name + ' uploaded.');
  });
}

CotDropzone.presets.common.announce = function (message) {
  document.querySelector('[role="status"][aria-live="polite"]').textContent = '';
  document.querySelector('[role="status"][aria-live="polite"]').textContent = message;

    // Initialize announce element.
    // if (!(this.announceElement instanceof HTMLElement)) {
      // this.announceElement = document.body.appendChild(document.createElement('div'));
      // this.announceElement.classList.add('sr-only');
      // this.announceElement.setAttribute('aria-live', 'polite');
      // this.announceElement.setAttribute('aria-atomic', false);
      // this.announceElement = document.querySelector('[role="status"][aria-live="polite"]');
    // }

    // if (this.announceElement instanceof HTMLElement) {

      // Append announcement.
      // const paragraph = document.createElement('p');
      // paragraph.appendChild(document.createTextNode(message));
      // this.announceElement.appendChild(paragraph);
      // this.announceElement.textContent = message;
      // this.element.querySelector('[role="status"][aria-live="polite"]').textContent = message;

      // document.getElementById('id').textContent = message;
    // }
}

CotDropzone.presets.default.announce = CotDropzone.presets.common.announce;

CotDropzone.presets.default.init = CotDropzone.mergeFunctions(CotDropzone.presets.common.init, function () {
  // this.options = JSON.JSON.stringify();

  // Add fields to preview template.
  if (this.options.getFieldsTemplate != null) {
      this.options.previewTemplate = this.options.previewTemplate.replace('<div class="dz-fields"></div>', `<div class="dz-fields">${this.options.getFieldsTemplate.call(this)}</div>`)
  }

  // Customize dropzone element with user interface.
  this.element.classList.add('dz-preset-default');
  this.element.innerHTML = /* html */ `
    <div role="status" aria-live="polite" aria-relevant="additions" class="sr-only"></div>
    <div class="dz-description"></div>
    <div class="dz-buttons-top">
      <button id="add_button_top" type="button" class="btn btn-default btn-addFiles">Add File</button>
      <button type="button" class="btn btn-default btn-startFileUpload">Start File Upload</button>
    </div>
    <div class="previewsContainer"></div>
    <div class="dz-buttons-bottom">
      <button type="button" class="btn btn-default btn-addFiles">Add File</button>
      <button type="button" class="btn btn-default btn-startFileUpload">Start File Upload</button>
    </div>
  `;

  this.previewsContainer = this.options.previewsContainer = this.element.querySelector('.previewsContainer');

  const addFilesButtons = this.element.querySelectorAll('.btn-addFiles');
  for (let index = 0, length = addFilesButtons.length; index < length; index++) {
      const button = addFilesButtons[index];
      button.addEventListener('click', (event) => {
          event.preventDefault();
          this.hiddenFileInput.click();
      });
  }

  const startFileUploadButtons = this.element.querySelectorAll('.btn-startFileUpload');
  for (let index = 0, length = startFileUploadButtons.length; index < length; index++) {
      const button = startFileUploadButtons[index];
      button.addEventListener('click', (event) => {
          event.preventDefault();
          this.enqueueFiles(this.getFilesWithStatus(Dropzone.ADDED));
      })
  }

  // Add descriptions base on options.
  const descriptions = [];

  if (this.options.acceptedFiles != null) {
      const acceptedFiles = this.options.acceptedFiles.split(',').map((value) => value.trim().toLowerCase());

      let fileTypes = [];
      for (let index = 0, length = acceptedFiles.length; index < length; index++) {
          if (acceptedFiles[index].indexOf('/') !== -1) {
              if (acceptedFiles[index].indexOf('/*') !== -1) {
                  fileTypes.push(`${acceptedFiles[index].substring(0, acceptedFiles[index].indexOf('/*'))} files`);
              } else if (acceptedFiles[index] === 'application/msword' || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.wordprocessingml.template' || acceptedFiles[index] === 'application/vnd.ms-word.document.macroenabled.12'
                  || acceptedFiles[index] === 'application/vnd.ms-word.template.macroenabled.12') {

                  fileTypes.push('Microsoft Word documents');
              } else if (acceptedFiles[index] === 'application/vnd.ms-excel' || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.template' || acceptedFiles[index] === 'application/vnd.ms-excel.sheet.macroenabled.12'
                  || acceptedFiles[index] === 'application/vnd.ms-excel.template.macroenabled.12' || acceptedFiles[index] === 'application/vnd.ms-excel.addin.macroenabled.12'
                  || acceptedFiles[index] === 'application/vnd.ms-excel.sheet.binary.macroenabled.12') {

                  fileTypes.push('Microsoft Excel spreadsheets');
              } else if (acceptedFiles[index] === 'application/vnd.ms-powerpoint' || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                  || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.presentationml.template' || acceptedFiles[index] === 'application/vnd.openxmlformats-officedocument.presentationml.slideshow'
                  || acceptedFiles[index] === 'application/vnd.ms-powerpoint.addin.macroenabled.12' || acceptedFiles[index] === 'application/vnd.ms-powerpoint.presentation.macroenabled.12'
                  || acceptedFiles[index] === 'application/vnd.ms-powerpoint.template.macroenabled.12' || acceptedFiles[index] === 'application/vnd.ms-powerpoint.slideshow.macroenabled.12') {

                  fileTypes.push('Microsoft Powerpoint documents');
              } else {
                  fileTypes.push(acceptedFiles[index].substring(acceptedFiles[index].indexOf('/') + 1));
              }
          } else {
              fileTypes.push(acceptedFiles[index] + ' files');
          }
      }
      fileTypes = fileTypes.filter((fileType, index, array) => array.indexOf(fileType) === index);
      var totalFileTypes = fileTypes.length;
      var lastFileType;
      if (fileTypes.length > 1) {
          lastFileType = fileTypes.pop();
      }
      var fileTypesString = fileTypes.join(', ');
      if (lastFileType) {
          fileTypesString = [fileTypesString, lastFileType].join(' or ');
      }
      descriptions.push(`Only the following files are allowed: ${fileTypesString}.`);
  }

  if (this.options.maxFiles != null) {
      descriptions.push(`Maximum ${this.options.maxFiles} uploaded file${+this.options.maxFiles === 1 ? '' : 's'}.`);
  }

  if (this.options.maxFilesize != null) {
      descriptions.push(`Maximum size for file attachment is ${this.options.maxFilesize} MB.`);
  }

  if (descriptions.length > 0) {
      const paragraph = document.createElement('p');
      paragraph.appendChild(document.createTextNode(descriptions.join(' ')));
      this.element.querySelector('.dz-description').appendChild(paragraph);
  }

  // Function for updating the dropzone element based on status.
  const updateElement = () => {

      // Update bottom button display.
      if (this.files.length > 0) {
          this.element.classList.add('dz-files-exists');
      } else {
          this.element.classList.remove('dz-files-exists');
      }

      // Update start file upload buttons state.
      if (this.getFilesWithStatus(Dropzone.ADDED).length > 0) {
          for (let index = 0, length = startFileUploadButtons.length; index < length; index++) {
              const button = startFileUploadButtons[index];
              button.removeAttribute('disabled');
          }
      } else {
          for (let index = 0, length = startFileUploadButtons.length; index < length; index++) {
              const button = startFileUploadButtons[index];
              button.setAttribute('disabled', '');
          }
      }
  }
  updateElement();

  // ---

  let row = 0;

  this.on('addedfile', (file) => {
      file.fields = file.fields || {};

      // Complete preview template.
      file.previewElement.querySelector('.btn-upload').addEventListener('click', (event) => {
          this.enqueueFile(file);
      });

      // Complete fields template
      if (this.options.setFieldsTemplate != null) {
          this.options.setFieldsTemplate.call(this, file, row);
      }
      row = row + 1;

      // Add generic thumbnail.
      if (file.dataURL == null) {
          let thumbnailSrc;
          if (file.thumbnailDataUri != null) {
              thumbnailSrc = file.thumbnailDataUri;
          } else if (file.type) {
              const mimeTypes = file.type.split('/');

              let mainType = this.options.thumbnailDataUris && this.options.thumbnailDataUris[mimeTypes[0]];

              if (mainType == null) {
                  mainType = this.options.thumbnailDataUris.default;
              } else {
                  thumbnailSrc = mainType[mimeTypes[1]] || mainType.default;
              }

              if (thumbnailSrc == null) {
                  thumbnailSrc = this.options.thumbnailDataUris.default;
              }
          } else {
              thumbnailSrc = this.options.thumbnailDataUris.default;
          }

          const thumbnailElement = file.previewElement.querySelector('[data-dz-thumbnail]');
          thumbnailElement.setAttribute('src', thumbnailSrc);
          if (this.options.thumbnailWidth) {
              thumbnailElement.style.width = `${+this.options.thumbnailWidth}px`;
          }
      }

      updateElement();

      if (this.options.setLink != null) {
          this.options.setLink.call(this, file);
      }

      // const focusable = $('input:visible, textarea:visible, button:visible', file.previewElement);
      // if (focusable.length > 0) {
      //   focusable[0].focus()
      // } else {
      //   addFilesButtons[0].focus();
      // }
      // addFilesButtons[0].setAttribute('tabIndex', '-1');
      // addFilesButtons[0].focus();

      // document.getElementById('add_button_top').focus();
      // console.log('FOCUSING ON', document.getElementById('add_button_top'));
  });

  this.on('removedfile', (file) => {
      const filesToReinsert = this.files.filter((file) => file.status === Dropzone.ERROR && file.isExcess === true);
      if (filesToReinsert.length > 0) {
          filesToReinsert.forEach((file) => {
              file.status = Dropzone.ADDED;
              file.status.isExcess = false;
              file.previewElement.querySelector('[data-dz-errormessage]').innerHTML = '';
          });

          filesToReinsert.forEach((file) => {
              this.removeFile(file);
          });

          this.options.addFiles.call(this, ...filesToReinsert);
      }

      updateElement();

      // addFilesButtons[0].focus();
  });

  // ---

  this.on('thumbnail', (file, datauri) => {
      file.thumbnailDataUri = datauri;
  });

  // ---

  this.on('sending', (file, xhr, formData) => {
      if (typeof this.options.getSid === 'function') {
          var sid = this.options.getSid.call(this);
          if (sid != null && sid != false && xhr.authSet !== true) {
              xhr.setRequestHeader('Authorization', sid);
              xhr.authSet == true;
          }
      }

      if (typeof this.options.beforeSend === 'function') {
          this.options.beforeSend.call(this, xhr, file, formData);
      }
  });

  this.on('success', function (file) {
      if (file.xhr && file.xhr.responseText) {
          try {
              const json = JSON.parse(file.xhr.responseText);
              if (json.BIN_ID && json.BIN_ID[0]) {
                  if (json.BIN_ID[0].bin_id || json.BIN_ID[0].file_name) {
                      if (json.BIN_ID[0].bin_id) {
                          file.bin_id = json.BIN_ID[0].bin_id;
                      }
                      if (json.BIN_ID[0].file_name) {
                          file.file_name = json.BIN_ID[0].file_name;
                      }
                  } else {
                      file.bin_id = json.BIN_ID[0];
                  }
              }

              if (json.FILE_NAME) {
                  file.file_name = json.FILE_NAME[0];
              }

              if (json.FILE_PATH) {
                  file.file_path = json.FILE_PATH;
              }

              file.uploadDate = (new Date()).toISOString();
          } catch (error) {
              // Do nothing.
              console.error(error);
          }
      }

      file.previewElement.querySelector('.dz-success-message').appendChild(document.createTextNode('File upload successful.'));

      if (this.options.setLink != null) {
          this.options.setLink.call(this, file);
      }
  });

  this.on('complete', function (file) {
      updateElement();
  });
});
