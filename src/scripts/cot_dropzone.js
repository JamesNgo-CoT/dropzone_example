Dropzone.autoDiscover = false;

////////////////////////////////////////////////////////////////////////////////

class CotDropzone {
  constructor(options) {
    if (options != null) {
      this.render(options);
    }
  }

  render(options = {}) {

    // Merge default + preset + argument options.
    let defaultOptions = Object.assign({}, CotDropzone.defaultOptions);

    let preset = options.preset || defaultOptions.preset;
    if (typeof preset === 'string') {
      preset = CotDropzone.presets[preset];
    }

    if (preset != null) {
      defaultOptions = Object.assign(defaultOptions, preset);
    }

    for (const key in defaultOptions) {
      if (defaultOptions.hasOwnProperty(key) && !options.hasOwnProperty(key)) {
        options[key] = defaultOptions[key];
      }
    }

    if (options.acceptedFiles != null) {
      const acceptedFiles = options.acceptedFiles.split(',').map((acceptedFile) => {
        acceptedFile = acceptedFile.trim();
        if (CotDropzone.acceptedFilesReplacement[acceptedFile] != null) {
          acceptedFile = CotDropzone.acceptedFilesReplacement[acceptedFile];
        }
        return acceptedFile;
      });
      options.acceptedFiles = acceptedFiles.join(', ');
    }

    // Instantiate Dropzone.
    this.dropzone = new Dropzone(options.selector, options);
  }

  addFile(file) {
    if (this.dropzone.options.addFile == null) {
      return;
    }
    this.dropzone.options.addFile.call(this.dropzone, file);
  }

  addFiles(...files) {
    if (this.dropzone.options.addFiles == null) {
      return;
    }
    this.dropzone.options.addFiles.call(this.dropzone, ...files);
  }

  addInitialFile(file) {
    if (this.dropzone.options.addInitialFile == null) {
      return;
    }
    this.dropzone.options.addInitialFile.call(this.dropzone, file);
  }

  addInitialFiles(...files) {
    if (this.dropzone.options.addInitialFiles == null) {
      return;
    }
    this.dropzone.options.addInitialFiles.call(this.dropzone, ...files);
  }
}

////////////////////////////////////////////////////////////////////////////////

CotDropzone.defaultOptions = {
  maxFiles: 3,
  maxFilesize: 5,
  preset: 'default'
};

CotDropzone.mergeFunctions = (...funcs) => {
  return function (...args) {
    for (let index = 0, length = funcs.length; index < length; index++) {
      if (typeof funcs[index] === 'function') {
        funcs[index].call(this, ...args);
      }
    }
  }
};

CotDropzone.acceptedFilesReplacement = (() => {
  const acceptedFilesReplacement = {
    'application/x-msword': [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
      'application/vnd.ms-word.document.macroEnabled.12',
      'application/vnd.ms-word.template.macroEnabled.12'
    ].join(', '),
    'application/x-msexcel': [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.template.macroEnabled.12',
      'application/vnd.ms-excel.addin.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
    ].join(', '),
    'application/x-mspowerpoint': [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.template',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'application/vnd.ms-powerpoint.addin.macroEnabled.12',
      'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
      'application/vnd.ms-powerpoint.template.macroEnabled.12',
      'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'
    ].join(', ')
  }

  acceptedFilesReplacement['application/x-msdocument'] = [
    acceptedFilesReplacement['application/x-msword'],
    acceptedFilesReplacement['application/x-msexcel'],
    acceptedFilesReplacement['application/x-mspowerpoint'],
  ].join(', ');

  return acceptedFilesReplacement;
})();



////////////////////////////////////////////////////////////////////////////////

CotDropzone.presets = {};

////////////////////////////////////////////////////////////////////////////////

CotDropzone.presets.common = {
  init() {
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
  },

  // ---------------------------------------------------------------------------

  announce(message) {

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
      this.element.querySelector('[role="status"][aria-live="polite"]').textContent = message;
    // }
  },

  // ---------------------------------------------------------------------------

  addFile(file) {
    file.name = file.name || 'untitled';
    file.size = file.size == null ? 0 : file.size;
    file.type = file.type || 'unknown';
    file.accepted = true;
    // file.isExcess = false;

    file.status = file.status || Dropzone.ADDED;

    if (file.status === 'deleted') {
      this.deletedFiles.push(file);
    } else {
      this.files.push(file);
      this.emit('addedfile', file);
      if (file.thumbnailDataUri != null) {
        this.emit('thumbnail', file, file.thumbnailDataUri);
      }

      if (file.status === Dropzone.ERROR) {
        file.accepted = false;
        this.emit('error', file, file.errorMessage || 'Error', true);
      } else if (this.options.maxFiles != null) {
        if (this.getAcceptedFiles().length === this.options.maxFiles) {
          this.emit('maxfilesreached', file);
        } else if (this.getAcceptedFiles().length > this.options.maxFiles) {
          file.accepted = false;
          file.status = Dropzone.ERROR;
          this.emit('maxfilesexceeded', file);
          this.emit('error', file, this.options.dictMaxFilesExceeded || 'Error');
        }
      }
    }
  },

  addFiles(...files) {
    if (this.options.addFile != null) {
      if (Array.isArray(files[0])) {
        files = files[0];
      }

      files.forEach((file) => {
        this.options.addFile.call(this, file);
      });
    }
  },

  addInitialFile(file) {
    if (this.options.addFile != null) {
      file.status = file.status || Dropzone.SUCCESS;

      this.options.addFile.call(this, file);

      this.emit('processing', file);
      this.emit('complete', file);
    }
  },

  addInitialFiles(...files) {
    if (this.options.addInitialFile != null) {
      if (Array.isArray(files[0])) {
        files = files[0];
      }

      files.forEach((file) => {
        this.options.addInitialFile.call(this, file);
      });
    }
  },

  // ---------------------------------------------------------------------------

  thumbnailDataUris: (() => {
    const thumbnailDataUris = {
      'default': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZSBmYS13LTEyIiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4NCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTM2OS45IDk3LjlMMjg2IDE0QzI3NyA1IDI2NC44LS4xIDI1Mi4xLS4xSDQ4QzIxLjUgMCAwIDIxLjUgMCA0OHY0MTZjMCAyNi41IDIxLjUgNDggNDggNDhoMjg4YzI2LjUgMCA0OC0yMS41IDQ4LTQ4VjEzMS45YzAtMTIuNy01LjEtMjUtMTQuMS0zNHpNMzMyLjEgMTI4SDI1NlY1MS45bDc2LjEgNzYuMXpNNDggNDY0VjQ4aDE2MHYxMDRjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTA0djI4OEg0OHoiPjwvcGF0aD48L3N2Zz4=',
      'text': {
        'default': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLWFsdCIgY2xhc3M9InN2Zy1pbmxpbmUtLWZhIGZhLWZpbGUtYWx0IGZhLXctMTIiIHJvbGU9ImltZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzg0IDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMjg4IDI0OHYyOGMwIDYuNi01LjQgMTItMTIgMTJIMTA4Yy02LjYgMC0xMi01LjQtMTItMTJ2LTI4YzAtNi42IDUuNC0xMiAxMi0xMmgxNjhjNi42IDAgMTIgNS40IDEyIDEyem0tMTIgNzJIMTA4Yy02LjYgMC0xMiA1LjQtMTIgMTJ2MjhjMCA2LjYgNS40IDEyIDEyIDEyaDE2OGM2LjYgMCAxMi01LjQgMTItMTJ2LTI4YzAtNi42LTUuNC0xMi0xMi0xMnptMTA4LTE4OC4xVjQ2NGMwIDI2LjUtMjEuNSA0OC00OCA0OEg0OGMtMjYuNSAwLTQ4LTIxLjUtNDgtNDhWNDhDMCAyMS41IDIxLjUgMCA0OCAwaDIwNC4xQzI2NC44IDAgMjc3IDUuMSAyODYgMTQuMUwzNjkuOSA5OGM5IDguOSAxNC4xIDIxLjIgMTQuMSAzMy45em0tMTI4LTgwVjEyOGg3Ni4xTDI1NiA1MS45ek0zMzYgNDY0VjE3NkgyMzJjLTEzLjMgMC0yNC0xMC43LTI0LTI0VjQ4SDQ4djQxNmgyODh6Ij48L3BhdGg+PC9zdmc+'
      },
      'image': {
        'default': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLWltYWdlIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZS1pbWFnZSBmYS13LTEyIiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4NCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTM2OS45IDk3LjlMMjg2IDE0QzI3NyA1IDI2NC44LS4xIDI1Mi4xLS4xSDQ4QzIxLjUgMCAwIDIxLjUgMCA0OHY0MTZjMCAyNi41IDIxLjUgNDggNDggNDhoMjg4YzI2LjUgMCA0OC0yMS41IDQ4LTQ4VjEzMS45YzAtMTIuNy01LjEtMjUtMTQuMS0zNHpNMzMyLjEgMTI4SDI1NlY1MS45bDc2LjEgNzYuMXpNNDggNDY0VjQ4aDE2MHYxMDRjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTA0djI4OEg0OHptMzItNDhoMjI0VjI4OGwtMjMuNS0yMy41Yy00LjctNC43LTEyLjMtNC43LTE3IDBMMTc2IDM1MmwtMzkuNS0zOS41Yy00LjctNC43LTEyLjMtNC43LTE3IDBMODAgMzUydjY0em00OC0yNDBjLTI2LjUgMC00OCAyMS41LTQ4IDQ4czIxLjUgNDggNDggNDggNDgtMjEuNSA0OC00OC0yMS41LTQ4LTQ4LTQ4eiI+PC9wYXRoPjwvc3ZnPg=='
      },
      'audio': {
        'default': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLWF1ZGlvIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZS1hdWRpbyBmYS13LTEyIiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4NCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTM2OS45NDEgOTcuOTQxbC04My44ODItODMuODgyQTQ4IDQ4IDAgMCAwIDI1Mi4xMTggMEg0OEMyMS40OSAwIDAgMjEuNDkgMCA0OHY0MTZjMCAyNi41MSAyMS40OSA0OCA0OCA0OGgyODhjMjYuNTEgMCA0OC0yMS40OSA0OC00OFYxMzEuODgyYTQ4IDQ4IDAgMCAwLTE0LjA1OS0zMy45NDF6TTMzMi4xMTggMTI4SDI1NlY1MS44ODJMMzMyLjExOCAxMjh6TTQ4IDQ2NFY0OGgxNjB2MTA0YzAgMTMuMjU1IDEwLjc0NSAyNCAyNCAyNGgxMDR2Mjg4SDQ4em0xNDQtNzYuMDI0YzAgMTAuNjkxLTEyLjkyNiAxNi4wNDUtMjAuNDg1IDguNDg1TDEzNiAzNjAuNDg2aC0yOGMtNi42MjcgMC0xMi01LjM3My0xMi0xMnYtNTZjMC02LjYyNyA1LjM3My0xMiAxMi0xMmgyOGwzNS41MTUtMzYuOTQ3YzcuNTYtNy41NiAyMC40ODUtMi4yMDYgMjAuNDg1IDguNDg1djEzNS45NTJ6bTQxLjIwMS00Ny4xM2M5LjA1MS05LjI5NyA5LjA2LTI0LjEzMy4wMDEtMzMuNDM5LTIyLjE0OS0yMi43NTIgMTIuMjM1LTU2LjI0NiAzNC4zOTUtMzMuNDgxIDI3LjE5OCAyNy45NCAyNy4yMTIgNzIuNDQ0LjAwMSAxMDAuNDAxLTIxLjc5MyAyMi4zODYtNTYuOTQ3LTEwLjMxNS0zNC4zOTctMzMuNDgxeiI+PC9wYXRoPjwvc3ZnPg=='
      },
      'video': {
        'default': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLXZpZGVvIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZS12aWRlbyBmYS13LTEyIiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4NCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTM2OS45NDEgOTcuOTQxbC04My44ODItODMuODgyQTQ4IDQ4IDAgMCAwIDI1Mi4xMTggMEg0OEMyMS40OSAwIDAgMjEuNDkgMCA0OHY0MTZjMCAyNi41MSAyMS40OSA0OCA0OCA0OGgyODhjMjYuNTEgMCA0OC0yMS40OSA0OC00OFYxMzEuODgyYTQ4IDQ4IDAgMCAwLTE0LjA1OS0zMy45NDF6TTMzMi4xMTggMTI4SDI1NlY1MS44ODJMMzMyLjExOCAxMjh6TTQ4IDQ2NFY0OGgxNjB2MTA0YzAgMTMuMjU1IDEwLjc0NSAyNCAyNCAyNGgxMDR2Mjg4SDQ4em0yMjguNjg3LTIxMS4zMDNMMjI0IDMwNS4zNzRWMjY4YzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwSDEwMGMtMTEuMDQ2IDAtMjAgOC45NTQtMjAgMjB2MTA0YzAgMTEuMDQ2IDguOTU0IDIwIDIwIDIwaDEwNGMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMHYtMzcuMzc0bDUyLjY4NyA1Mi42NzRDMjg2LjcwNCAzOTcuMzE4IDMwNCAzOTAuMjggMzA0IDM3NS45ODZWMjY0LjAxMWMwLTE0LjMxMS0xNy4zMDktMjEuMzE5LTI3LjMxMy0xMS4zMTR6Ij48L3BhdGg+PC9zdmc+'
      },
      'application': {
        'msword': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLXdvcmQiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1maWxlLXdvcmQgZmEtdy0xMiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0zNjkuOSA5Ny45TDI4NiAxNEMyNzcgNSAyNjQuOC0uMSAyNTIuMS0uMUg0OEMyMS41IDAgMCAyMS41IDAgNDh2NDE2YzAgMjYuNSAyMS41IDQ4IDQ4IDQ4aDI4OGMyNi41IDAgNDgtMjEuNSA0OC00OFYxMzEuOWMwLTEyLjctNS4xLTI1LTE0LjEtMzR6TTMzMi4xIDEyOEgyNTZWNTEuOWw3Ni4xIDc2LjF6TTQ4IDQ2NFY0OGgxNjB2MTA0YzAgMTMuMyAxMC43IDI0IDI0IDI0aDEwNHYyODhINDh6bTIyMC4xLTIwOGMtNS43IDAtMTAuNiA0LTExLjcgOS41LTIwLjYgOTcuNy0yMC40IDk1LjQtMjEgMTAzLjUtLjItMS4yLS40LTIuNi0uNy00LjMtLjgtNS4xLjMuMi0yMy42LTk5LjUtMS4zLTUuNC02LjEtOS4yLTExLjctOS4yaC0xMy4zYy01LjUgMC0xMC4zIDMuOC0xMS43IDkuMS0yNC40IDk5LTI0IDk2LjItMjQuOCAxMDMuNy0uMS0xLjEtLjItMi41LS41LTQuMi0uNy01LjItMTQuMS03My4zLTE5LjEtOTktMS4xLTUuNi02LTkuNy0xMS44LTkuN2gtMTYuOGMtNy44IDAtMTMuNSA3LjMtMTEuNyAxNC44IDggMzIuNiAyNi43IDEwOS41IDMzLjIgMTM2IDEuMyA1LjQgNi4xIDkuMSAxMS43IDkuMWgyNS4yYzUuNSAwIDEwLjMtMy43IDExLjYtOS4xbDE3LjktNzEuNGMxLjUtNi4yIDIuNS0xMiAzLTE3LjNsMi45IDE3LjNjLjEuNCAxMi42IDUwLjUgMTcuOSA3MS40IDEuMyA1LjMgNi4xIDkuMSAxMS42IDkuMWgyNC43YzUuNSAwIDEwLjMtMy43IDExLjYtOS4xIDIwLjgtODEuOSAzMC4yLTExOSAzNC41LTEzNiAxLjktNy42LTMuOC0xNC45LTExLjYtMTQuOWgtMTUuOHoiPjwvcGF0aD48L3N2Zz4=',
        'vnd.ms-excel': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLWV4Y2VsIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZS1leGNlbCBmYS13LTEyIiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4NCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTM2OS45IDk3LjlMMjg2IDE0QzI3NyA1IDI2NC44LS4xIDI1Mi4xLS4xSDQ4QzIxLjUgMCAwIDIxLjUgMCA0OHY0MTZjMCAyNi41IDIxLjUgNDggNDggNDhoMjg4YzI2LjUgMCA0OC0yMS41IDQ4LTQ4VjEzMS45YzAtMTIuNy01LjEtMjUtMTQuMS0zNHpNMzMyLjEgMTI4SDI1NlY1MS45bDc2LjEgNzYuMXpNNDggNDY0VjQ4aDE2MHYxMDRjMCAxMy4zIDEwLjcgMjQgMjQgMjRoMTA0djI4OEg0OHptMjEyLTI0MGgtMjguOGMtNC40IDAtOC40IDIuNC0xMC41IDYuMy0xOCAzMy4xLTIyLjIgNDIuNC0yOC42IDU3LjctMTMuOS0yOS4xLTYuOS0xNy4zLTI4LjYtNTcuNy0yLjEtMy45LTYuMi02LjMtMTAuNi02LjNIMTI0Yy05LjMgMC0xNSAxMC0xMC40IDE4bDQ2LjMgNzgtNDYuMyA3OGMtNC43IDggMS4xIDE4IDEwLjQgMThoMjguOWM0LjQgMCA4LjQtMi40IDEwLjUtNi4zIDIxLjctNDAgMjMtNDUgMjguNi01Ny43IDE0LjkgMzAuMiA1LjkgMTUuOSAyOC42IDU3LjcgMi4xIDMuOSA2LjIgNi4zIDEwLjYgNi4zSDI2MGM5LjMgMCAxNS0xMCAxMC40LTE4TDIyNCAzMjBjLjctMS4xIDMwLjMtNTAuNSA0Ni4zLTc4IDQuNy04LTEuMS0xOC0xMC4zLTE4eiI+PC9wYXRoPjwvc3ZnPg==',
        'vnd.ms-powerpoint': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLXBvd2VycG9pbnQiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1maWxlLXBvd2VycG9pbnQgZmEtdy0xMiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0zNjkuOSA5Ny45TDI4NiAxNEMyNzcgNSAyNjQuOC0uMSAyNTIuMS0uMUg0OEMyMS41IDAgMCAyMS41IDAgNDh2NDE2YzAgMjYuNSAyMS41IDQ4IDQ4IDQ4aDI4OGMyNi41IDAgNDgtMjEuNSA0OC00OFYxMzEuOWMwLTEyLjctNS4xLTI1LTE0LjEtMzR6TTMzMi4xIDEyOEgyNTZWNTEuOWw3Ni4xIDc2LjF6TTQ4IDQ2NFY0OGgxNjB2MTA0YzAgMTMuMyAxMC43IDI0IDI0IDI0aDEwNHYyODhINDh6bTcyLTYwVjIzNmMwLTYuNiA1LjQtMTIgMTItMTJoNjkuMmMzNi43IDAgNjIuOCAyNyA2Mi44IDY2LjMgMCA3NC4zLTY4LjcgNjYuNS05NS41IDY2LjVWNDA0YzAgNi42LTUuNCAxMi0xMiAxMkgxMzJjLTYuNiAwLTEyLTUuNC0xMi0xMnptNDguNS04Ny40aDIzYzcuOSAwIDEzLjktMi40IDE4LjEtNy4yIDguNS05LjggOC40LTI4LjUuMS0zNy44LTQuMS00LjYtOS45LTctMTcuNC03aC0yMy45djUyeiI+PC9wYXRoPjwvc3ZnPg==',
        'pdf': 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhciIgZGF0YS1pY29uPSJmaWxlLXBkZiIgY2xhc3M9InN2Zy1pbmxpbmUtLWZhIGZhLWZpbGUtcGRmIGZhLXctMTIiIHJvbGU9ImltZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzg0IDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMzY5LjkgOTcuOUwyODYgMTRDMjc3IDUgMjY0LjgtLjEgMjUyLjEtLjFINDhDMjEuNSAwIDAgMjEuNSAwIDQ4djQxNmMwIDI2LjUgMjEuNSA0OCA0OCA0OGgyODhjMjYuNSAwIDQ4LTIxLjUgNDgtNDhWMTMxLjljMC0xMi43LTUuMS0yNS0xNC4xLTM0ek0zMzIuMSAxMjhIMjU2VjUxLjlsNzYuMSA3Ni4xek00OCA0NjRWNDhoMTYwdjEwNGMwIDEzLjMgMTAuNyAyNCAyNCAyNGgxMDR2Mjg4SDQ4em0yNTAuMi0xNDMuN2MtMTIuMi0xMi00Ny04LjctNjQuNC02LjUtMTcuMi0xMC41LTI4LjctMjUtMzYuOC00Ni4zIDMuOS0xNi4xIDEwLjEtNDAuNiA1LjQtNTYtNC4yLTI2LjItMzcuOC0yMy42LTQyLjYtNS45LTQuNCAxNi4xLS40IDM4LjUgNyA2Ny4xLTEwIDIzLjktMjQuOSA1Ni0zNS40IDc0LjQtMjAgMTAuMy00NyAyNi4yLTUxIDQ2LjItMy4zIDE1LjggMjYgNTUuMiA3Ni4xLTMxLjIgMjIuNC03LjQgNDYuOC0xNi41IDY4LjQtMjAuMSAxOC45IDEwLjIgNDEgMTcgNTUuOCAxNyAyNS41IDAgMjgtMjguMiAxNy41LTM4Ljd6bS0xOTguMSA3Ny44YzUuMS0xMy43IDI0LjUtMjkuNSAzMC40LTM1LTE5IDMwLjMtMzAuNCAzNS43LTMwLjQgMzV6bTgxLjYtMTkwLjZjNy40IDAgNi43IDMyLjEgMS44IDQwLjgtNC40LTEzLjktNC4zLTQwLjgtMS44LTQwLjh6bS0yNC40IDEzNi42YzkuNy0xNi45IDE4LTM3IDI0LjctNTQuNyA4LjMgMTUuMSAxOC45IDI3LjIgMzAuMSAzNS41LTIwLjggNC4zLTM4LjkgMTMuMS01NC44IDE5LjJ6bTEzMS42LTVzLTUgNi0zNy4zLTcuOGMzNS4xLTIuNiA0MC45IDUuNCAzNy4zIDcuOHoiPjwvcGF0aD48L3N2Zz4='
      }
    }

    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.wordprocessingml.document'] = thumbnailDataUris['application']['msword'];
    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.wordprocessingml.template'] = thumbnailDataUris['application']['msword'];
    thumbnailDataUris['application']['vnd.ms-word.document.macroEnabled.12'] = thumbnailDataUris['application']['msword'];
    thumbnailDataUris['application']['vnd.ms-word.template.macroEnabled.12'] = thumbnailDataUris['application']['msword'];

    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = thumbnailDataUris['application']['vnd.ms-excel'];
    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.spreadsheetml.template'] = thumbnailDataUris['application']['vnd.ms-excel'];
    thumbnailDataUris['application']['vnd.ms-excel.sheet.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-excel'];
    thumbnailDataUris['application']['vnd.ms-excel.template.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-excel'];
    thumbnailDataUris['application']['vnd.ms-excel.addin.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-excel'];
    thumbnailDataUris['application']['vnd.ms-excel.sheet.binary.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-excel'];

    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.presentationml.presentation'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.presentationml.template'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.openxmlformats-officedocument.presentationml.slideshow'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.ms-powerpoint.addin.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.ms-powerpoint.presentation.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.ms-powerpoint.template.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];
    thumbnailDataUris['application']['vnd.ms-powerpoint.slideshow.macroEnabled.12'] = thumbnailDataUris['application']['vnd.ms-powerpoint'];

    return thumbnailDataUris;
  })()
};

////////////////////////////////////////////////////////////////////////////////

CotDropzone.presets.default = {
  autoQueue: false,
  thumbnailHeight: 48,
  thumbnailWidth: 48,

  previewTemplate: /* html */ `
    <div class="dz-preview dz-file-preview">
      <div class="dz-left">
        <img data-dz-thumbnail />
      </div>

      <div class="dz-middle">
        <div class="dz-details">
          <!-- <div class="dz-filename"><span data-dz-name></span> <span data-dz-size></span></div> -->
          <div class="dz-filename"><div data-dz-name></div> <div data-dz-size></div></div>
        </div>

        <div class="dz-status">
          <div class="progress progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="progress-bar progress-bar-success" data-dz-uploadprogress></div>
          </div>

          <div class="dz-error-message">
            <span data-dz-errormessage></span>
          </div>

          <div class="dz-success-message"></div>
        </div>

        <div class="dz-fields"></div>
      </div>

      <div class="dz-right">
        <button type="button" class="btn btn-block btn-primary btn-upload">
          <span>Upload<span class="sr-only"> <span data-dz-name></span></span></span>
        </button>

        <button type="button" data-dz-remove class="btn btn-block btn-warning btn-cancel">
          <span>Cancel<span class="sr-only"> <span data-dz-name></span></span></span>
        </button>

        <button type="button" data-dz-remove class="btn btn-block btn-danger btn-delete">
          <span>Delete<span class="sr-only"> <span data-dz-name></span></span></span>
        </button>
      </div>
    </div>
  `,

  init: CotDropzone.mergeFunctions(CotDropzone.presets.common.init, function () {
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
  }),

  // ---------------------------------------------------------------------------

  announce: CotDropzone.presets.common.announce,

  thumbnailDataUris: CotDropzone.presets.common.thumbnailDataUris,

  // ---------------------------------------------------------------------------

  fields: [],

  onFieldChange(file, files) { },

  getFieldsTemplate() {
    const getFieldTemplate = (field) => {
      if (field == null) {
        return '';
      }

      let fieldString;
      switch (field.type) {
        case 'textarea':
          fieldString = /* html */ `<textarea title="${field.title}" aria-required="${field.required === true ? 'true' : 'false'}" class="form-control${field.required === true ? ' required' : ''}" placeholder="${field.placeholder || ''}" row="${field.row || ''}" col="${field.col || ''}"></textarea>`;
          break;

        default:
          fieldString = /* html */ `<input title="${field.title}" type="${field.type || 'text'}" aria-required="${field.required === true ? 'true' : 'false'}" class="form-control${field.required === true ? ' required' : ''}" placeholder="${field.placeholder || ''}"></input>`;
      }

      return /* html */ `
        <div class="row">
          <div data-name="${field.name}" class="col-xs-12 form-group form-group-vertical has-feedback">
            <div>
              <label class="control-label">
                <span>${field.title}</span>
                ${field.required !== true ? '<span class="optional">(optional)</span>' : ''}
              </label>
              ${field.prehelptext != null ? '<p class="helptext prehelptext">' + field.prehelptext + '</p>' : ''}
              <div class="entryField">
                ${fieldString}
              </div>
              ${field.posthelptext != null ? '<p class="helptext posthelptext">' + field.posthelptext + '</p>' : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Add fields to preview template.
    if (this.options.fields == null) {
      this.options.fields = [];
    }

    let template = '';
    this.options.fields.forEach((field) => {
      template = template + getFieldTemplate(field);
    });
    return template;
  },

  setFieldsTemplate(file, row) {
    const setFieldTemplate = (field) => {
      const name = `${field.name || field.id}_${row}`;

      const formGroup = file.previewElement.querySelector(`[data-name="${field.name || field.id}"]`);
      formGroup.setAttribute('id', `${name}Element`);
      formGroup.getElementsByTagName('label')[0].setAttribute('for', name);

      const describedBy = [];

      if (field.prehelptext != null) {
        const id = `prehelptext_${name}`;
        formGroup.querySelector('.prehelptext').setAttribute('id', id);
        describedBy.push(id)
      }

      if (field.posthelptext != null) {
        const id = `posthelptext_${name}`;
        formGroup.querySelector('.posthelptext').setAttribute('id', id);
        describedBy.push(id)
      }

      let element;
      switch (field.type) {
        case 'textarea':
          element = formGroup.getElementsByTagName('textarea')[0];
          break;

        default:
          element = formGroup.getElementsByTagName('input')[0];
      }

      element.setAttribute('id', name);
      element.setAttribute('name', name);

      if (describedBy.length > 0) {
        element.setAttribute('aria-describedby', describedBy.join(' '));
      }

      if (fv) {
        const elementValidator = field.validator || {};
        if (field.required) {
          elementValidator.notEmpty = {
            message: field.title + ' is required.'
          };
        }
        fv.addField(name, { validators: elementValidator });
      }

      if (file.fields[field.name] == null) {
        // file.fields[field.name] = null;
      } else {
        element.value = file.fields[field.name];
      }

      $(element).change((event) => {
        if (event.currentTarget.value != null && event.currentTarget.value != '') {
          file.fields[field.name] = event.currentTarget.value;
        } else {
          delete file.fields[field.name];
        }

        if (this.options.onFieldChange != null) {
          this.options.onFieldChange(file, this.files);
        }
      });
    }

    let fv;
    const $form = $(file.previewElement).closest('form');
    if ($form.length > 0) {
      fv = $form.data('formValidation');
    }

    this.options.fields = this.options.fields || [];

    this.options.fields.forEach((field) => {
      setFieldTemplate(field);
    });
  },

  // ---------------------------------------------------------------------------

  getSid() {
    return false;
  },

  getNasLink(file) {
    return file.file_path + '/' + file.file_name;
  },

  getLink(file) {
    if (file.bin_id || (file.file_name && file.file_path)) {
      let url;

      if (file.bin_id) {
        if (this.options.url.indexOf('/cc_sr_admin_v1/upload/') !== -1) {
          // V1
          url = this.options.url.substring(0, this.options.url.lastIndexOf('/') + 1) + file.bin_id;
        } else {
          // V2
          url = this.options.url.replace(/\/upload\/([^/]*)\/([^/]*)/, '/retrieve/$1/') + file.bin_id;
        }
      } else {
        // NAS
        if (this.options.getNasLink != null) {
          url = this.options.getNasLink.call(this, file);
        }
      }

      var sid;
      if (this.options.getSid != null) {
        sid = this.options.getSid.call(this);
      }
      if (sid != null && sid != false) {
        url += '?sid=' + sid;
      }

      return url || false;
    } else {
      return false;
    }
  },

  setLink(file) {
    let link;

    if (this.options.getLink != null) {
      link = this.options.getLink.call(this, file);
    }

    if (link != null && link != false) {
      if (!(link instanceof jQuery) && link.nodeType !== 1) {
        const href = link;
        link = document.createElement('a');
        link.setAttribute('href', href);
      }

      const $link = $(link);
      $('[data-dz-thumbnail], .dz-filename > [data-dz-name]', file.previewElement).wrap($link);
    }
  },

  // ---------------------------------------------------------------------------

  addFile: CotDropzone.presets.common.addFile,
  addFiles: CotDropzone.presets.common.addFiles,
  addInitialFile: CotDropzone.presets.common.addInitialFile,
  addInitialFiles: CotDropzone.presets.common.addInitialFiles,

  // ---------------------------------------------------------------------------

  valueMapFromFiles({ name, size, type, fields, status, bin_id, file_name, file_path, uploadDate, errorMessage, errorType }) {
    return { name, size, type, fields, status, bin_id, file_name, file_path, uploadDate, errorMessage, errorType };
  },

  valueMapToFiles({ name, size, type, fields, status, bin_id, file_name, file_path, uploadDate, errorMessage, errorType }) {
    return { name, size, type, fields, status, bin_id, file_name, file_path, uploadDate, errorMessage, errorType };
  }
};
