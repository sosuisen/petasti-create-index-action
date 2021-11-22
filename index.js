const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');

try {
  const indexFileName = core.getInput('index-file-name');
  console.log(`index: ${indexFileName}!`);

  console.log(`path: ${path.resolve('./')}`);

  // Get note list
  /*
  const noteDirList = 
  for (const noteDir of noteDirList) {
    count++;
    // eslint-disable-next-line no-await-in-loop
    const prop: NoteProp = (await noteDir.get('prop')) as NoteProp;
    const pathArr = noteDir.collectionPath.split('/'); // collectionPath is note/nXXXXXX/
    prop._id = pathArr[1]; // Set note id instead of 'prop'.
    initialNoteState.set(prop._id, prop);

    if (startingProgressBar) {
      startingProgressBar.detail =
        MESSAGE('loadingNoteProgressBarBody') + `(${count}/${noteDirList.length})`;
    }
  }
  */
} catch (error) {
  core.setFailed(error.message);
}