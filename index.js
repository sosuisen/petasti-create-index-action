const core = require('@actions/core');
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const yaml = require('js-yaml');

function loadFrontMatterMarkdown (text) {
  const mdArray = text.split('\n');
  let firstLine = '_';
  let yamlText = '';
  let markdownText = '';
  let startFrontMatter = false;
  let endFrontMatter = false;
  for (let i = 0; i < mdArray.length; i++) {
    if (mdArray[i] === '---') {
      if (!startFrontMatter) {
        startFrontMatter = true;
        continue;
      }
      else if (!endFrontMatter) {
        endFrontMatter = true;
        continue;
      }
    }
    if (startFrontMatter && !endFrontMatter) {
      if (yamlText !== '') {
        yamlText += '\n';
      }
      yamlText += mdArray[i];
    }
    else if (endFrontMatter) {
      if (markdownText !== '') {
        markdownText += '\n';
      }
      markdownText += mdArray[i];
      if (firstLine === '_' && !(mdArray[i] === '' || mdArray[i].match(/^\s+\n?$/) || mdArray[i].match(/^```\n?$/))) {
        firstLine = mdArray[i];
        firstLine = firstLine.replace(/^#+?\s/,'');
        firstLine = firstLine.replace(/^\*+?\s/,'');
        break;
      }
    }
  }

  try {
    const jsonDoc = yaml.load(yamlText);
    jsonDoc._body = firstLine;
    return jsonDoc;
  } catch {
    return undefined;  
  }
}

try {
  let titleName = core.getInput('title-name');
  if (!titleName) {
    titleName = 'INDEX';
  }
  let indexFileName = core.getInput('index-file-name');
  if (!indexFileName) {
    indexFileName = 'index.md';
  }
  console.log(`Write top index to: ${indexFileName}`);

  /**
   * Generate top index
   */
  const noteDirs = readdirSync('./note/');
  const notePropsSorted = [];
  for (const noteDir of noteDirs) {
    try {
      const notePropertyYAML = readFileSync('./note/' + noteDir + '/prop.yml', 'utf8');
      const noteProperty = yaml.load(notePropertyYAML);
      notePropsSorted.push(noteProperty);
    }
    catch(err) {
      console.log(err);
    }
  }
  notePropsSorted.sort((a, b) => {
    if (a.name > b.name) return 1;
    else if (a.name < b.name) return -1;
    return 0;
  });

  let topIndexText = `# ${titleName}\n\n`;
  for (let i=0; i<notePropsSorted.length; i++) {
    topIndexText += `- [${notePropsSorted[i].name}](./${notePropsSorted[i]._id.replace('/prop', `/${indexFileName}`)})\n`;
  }
  writeFileSync(indexFileName, topIndexText);

  /**
   * Generate note index
   * Cards are sorted by modified-date in descending order.
   */
  for (let i=0; i<notePropsSorted.length; i++) {
    const noteProp = notePropsSorted[i];
    const noteDir = `./${noteProp._id.replace('/prop', '/')}`;
    const cardSketchDirs = readdirSync(noteDir);
    const cardBodyPropsSorted = [];
    for (const cardSketchFile of cardSketchDirs) {
      if (cardSketchFile === 'prop.yml') continue;
      if (cardSketchFile === indexFileName) continue;
      try {
        // const cardSketchPropertyYAML = readFileSync(`${noteDir}/${cardSketchFile}`, 'utf8');
        // const cardSketchProperty = yaml.load(cardSketchPropertyYAML);
        const cardBodyPropertyYFMMD = readFileSync(`./card/${cardSketchFile.replace('.yml', '.md')}`, 'utf8');
        const cardBodyProperty = loadFrontMatterMarkdown(cardBodyPropertyYFMMD);
        cardBodyPropsSorted.push(cardBodyProperty);
      }
      catch(err) {
        console.log(err);
      }
    }
    cardBodyPropsSorted.sort((a, b) => {
      if (a.date.modifiedDate > b.date.modifiedDate) return -1;
      else if (a.date.modifiedDate < b.date.modifiedDate) return 1;
      return 0;
    });
  
    let noteIndexText = `# [${titleName}](../../${indexFileName})\n\n`;
    noteIndexText += `## [${noteProp.name}](./)\n\n`;
    for (let i=0; i<cardBodyPropsSorted.length; i++) {
      noteIndexText += `- [${cardBodyPropsSorted[i]._body}](../../${cardBodyPropsSorted[i]._id}.md) (${cardBodyPropsSorted[i].date.modifiedDate})\n`;
    }
    writeFileSync(noteDir + indexFileName, noteIndexText);
  }


} catch (error) {
  core.setFailed(error.message);
}
