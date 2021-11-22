const core = require('@actions/core');
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const yaml = require('js-yaml');

/**
 * Parse YAML Front Matter Markdown
 */
function parseFrontMatterMarkdown (text) {
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

/**
 * Parse YAML Front Matter
 */
function parseFrontMatter (text) {
  const mdArray = text.split('\n');
  let yamlText = '';
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
        break;
    }
  }

  try {
    const jsonDoc = yaml.load(yamlText);
    return jsonDoc;
  } catch {
    return undefined;  
  }
}

/**
 * Get local date and time
 */
function getLocalDateAndTime (dateStr, offset) {
  date = new Date(dateStr.replace(' ', 'T') + '.000z');
    return new Date(date.getTime() + offset * 60 * 1000)
    .toISOString()
    .replace(/^(.+?)T(.+?)\..+?$/, '$1 $2');
}

/**
 * Main
 */
try {
  let titleName = core.getInput('title-name');
  if (!titleName) {
    titleName = 'INDEX';
  }
  let indexFileName = 'README.md';

  let timezoneOffsetMinutes = core.getInput('timezone-offset-minutes');
  if (!timezoneOffsetMinutes) {
    timezoneOffsetMinutes = 0;
  }
  timezoneOffsetMinutes = 540;

  /**
   * Generate top index
   */
  let topIndexText = `# [${titleName}](./${indexFileName})\n\n`;
  topIndexText += `- [Note](./note/${indexFileName})\n\n`;
  topIndexText += `- [Snapshot](./snapshot/${indexFileName})\n\n`;
  writeFileSync(indexFileName, topIndexText);

  /**
   * Generate note index
   */
  const noteDirs = readdirSync('./note/');
  const notePropsSorted = [];
  for (const noteDir of noteDirs) {
    if (noteDir === indexFileName) continue;
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

  let noteIndexText = `# [${titleName}](../${indexFileName})\n\n`;
  noteIndexText += `## [Note](./${indexFileName})\n\n`;
  for (let i=0; i<notePropsSorted.length; i++) {
    noteIndexText += `- [${notePropsSorted[i].name}](./${notePropsSorted[i]._id.replace('note/', '').replace('/prop', `/${indexFileName}`)})\n`;
  }
  writeFileSync('note/' + indexFileName, noteIndexText);

  /**
   * Generate card index
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
        const cardBodyProperty = parseFrontMatterMarkdown(cardBodyPropertyYFMMD);
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
  
    let cardIndexText = `# [${titleName}](../../${indexFileName})\n\n`;
    cardIndexText += `## [Note](../${indexFileName})\n\n`;
    cardIndexText += `### [${noteProp.name}](./${indexFileName})\n\n`;
    for (let i=0; i<cardBodyPropsSorted.length; i++) {
      cardIndexText += `- [${cardBodyPropsSorted[i]._body}](../../${cardBodyPropsSorted[i]._id}.md) (${getLocalDateAndTime(cardBodyPropsSorted[i].date.modifiedDate, timezoneOffsetMinutes)})\n`;
    }
    writeFileSync(noteDir + indexFileName, cardIndexText);
  }

  /**
   * Generate snapshot index
   */
   const snapshotFiles = readdirSync('./snapshot/');
   const snapshotPropsSorted = [];
   for (const snapshotFile of snapshotFiles) {
     try {
       const snapshotPropertyYFMMD = readFileSync('./snapshot/' + snapshotFile, 'utf8');
       const snapshotProperty = parseFrontMatter(snapshotPropertyYFMMD);
       if (snapshotProperty !== undefined) snapshotPropsSorted.push(snapshotProperty);
     }
     catch(err) {
       console.log(err);
     }
   }
   snapshotPropsSorted.sort((a, b) => {
     if (a.createdDate > b.createdDate) return -1;
     else if (a.createdDate < b.createdDate) return 1;
     return 0;
   });
 
   let snapshotIndexText = `# [${titleName}](../${indexFileName})\n\n`;
   snapshotIndexText += `## [Snapshot](./${indexFileName})\n\n`;
   for (let i=0; i<snapshotPropsSorted.length; i++) {
     snapshotIndexText += `- [${snapshotPropsSorted[i].name}](../${snapshotPropsSorted[i]._id}.md) (${getLocalDateAndTime(snapshotPropsSorted[i].createdDate, timezoneOffsetMinutes)})\n`;
   }
   writeFileSync('snapshot/' + indexFileName, snapshotIndexText);
} catch (error) {
  core.setFailed(error.message);
}
