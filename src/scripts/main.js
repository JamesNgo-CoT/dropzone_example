// The main javascript file for corejs_feature_dropzone.
// IMPORTANT:
// Any resources from this project should be referenced using SRC_PATH preprocessor var
// Ex: let myImage = '/*@echo SRC_PATH*//img/sample.jpg';

$(function () {
  const app = new cot_app('Dropzone', {
    hasContentTop: false,
    hasContentBottom: false,
    hasContentRight: false,
    hasContentLeft: false,
    searchcontext: 'INTRA'
  });

  app.setBreadcrumb([
    { 'name': 'Dropzone', 'link': '#' }
  ], true);

  app.render();

  let container = $('#dropzone_container');

  const model = new Backbone.Model();

  const formDefinition = {
    title: 'Dropzone Form Implementation',
    id: 'form',
    useBinding: true,

    success(event) {
      event.preventDefault();

      alert(JSON.stringify(model.toJSON(), null, 3));

      return false;
    },

    sections: [
      {
        title: 'Section Title',

        rows: [
          {
            fields: [
              {
                title: 'Field 1',
                bindTo: 'field1',

              },
              {
                title: 'Field 2',
                bindTo: 'field2',
              },
              {
                title: 'Field 3',
                bindTo: 'field3'
              }
            ]
          }, {
            fields: [{
              title: 'Dropzone Field',
              type: 'dropzone',
              bindTo: 'dropzone_field1',
              required: true,

              posthelptext: 'post help text',
              prehelptext: 'pre help text',

              options: {
                url: 'https://maserati.corp.toronto.ca:49097/c3api_upload/upload/apptest/ref',

                acceptedFiles: 'video/*, image/*',
                maxFiles: 2,
                maxFilesize: 5,

                selector: '#cotDropzoneClass2',

                fields: [{
                  name: 'text01',
                  title: 'Text Field',
                  type: 'text',
                  prehelptext: 'Help text',
                  posthelptext: 'Help text'
                }, {
                  name: 'textarea01',
                  title: 'Textarea Field',
                  type: 'textarea',
                  prehelptext: 'Help text',
                  posthelptext: 'Help text'
                }]
              },
            }]
          }
        ]
      },
      {
        rows: [
          {
            fields: [
              {
                type: 'button',
                title: 'Submit',
                btnClass: 'primary btn-lg',
                onclick(event) {
                  event.preventDefault();
                  $(document.getElementById('form')).submit(); // NOTE Requires jQuery to trigger form validator
                }
              }
            ]
          }
        ]
      }
    ]
  };

  const cotForm = new CotForm(formDefinition);
  cotForm.setModel(model);
  cotForm.render({ target: container });
});
