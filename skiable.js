// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: snowflake;

/*
  Config
  
  Configure the ski resport you wish to display
  The string needs to exactly match the name of the resort in the following table:
  https://www.bergfex.at/oesterreich/schneewerte/
*/

const params = (config.runsInWidget && args.widgetParameter != null)?args.widgetParameter.split(","):[];

const skiresort = params[0] || 'Sölden';

if (config.runsInWidget) {
  const size = config.widgetFamily;
  const widget = await createWidget(size);

  Script.setWidget(widget);
  Script.complete();
} else {
  // For debugging
  const size = 'small';
  //const size = 'medium'
  //const size = 'large'
  const widget = await createWidget(size);
  if (size == 'small') {
    widget.presentSmall();
  } else if (size == 'medium') {
    widget.presentMedium();
  } else {
    widget.presentLarge();
  }
  Script.complete();
}

async function createWidget(size) {
  const resort = await fetchData(skiresort);

  if (resort === undefined) {
    const widget = new ListWidget();
    widget.addText('404 - resort not found');
    return widget;
  }

  if (size != 'small') {
    const widget = new ListWidget();
    widget.addText('size currently not supported');
    return widget;
  }

  const widget = new ListWidget();
  widget.setPadding(8, 14, 14, 14); // top, leading, bot, trailing
  widget.backgroundColor = new Color('#0091F2');

  const contentStack = widget.addStack();
  contentStack.layoutVertically();

  // Main info section with large snow height on the summit
  const primaryInfo = contentStack.addStack();
  primaryInfo.layoutHorizontally();

  primaryInfo.addSpacer();

  const summitHeight = primaryInfo.addText(`🏔 ${resort.summit}`);
  summitHeight.font = Font.boldRoundedSystemFont(45);
  summitHeight.minimumScaleFactor = 0.75;
  summitHeight.textColor = Color.white();

  // Line with valley snow info and lifts
  const secondaryInfo = contentStack.addStack();
  secondaryInfo.layoutHorizontally();

  secondaryInfo.addSpacer();
  const valleyHeight = secondaryInfo.addText(`🏘 ${resort.valley} 🚠 ${resort.lifts}`);
  valleyHeight.font = Font.systemFont(14);
  valleyHeight.textColor = Color.white();

  contentStack.addSpacer();

  // Resort name
  const nameStack = contentStack.addStack();
  const name = nameStack.addText(`${resort.resort}`);
  name.font = Font.boldRoundedSystemFont(30);
  name.textColor = Color.white();
  name.minimumScaleFactor = 0.65;

  // Refresh date
  const dateStack = contentStack.addStack();

  const date = dateStack.addText(`🔄 ${resort.date}`);
  date.font = Font.systemFont(10);
  date.textColor = Color.white();

  return widget;
}

// Helper functions
async function fetchData(resort) {
  const req = new Request(getLocalizedRequestURL());
  const site = await req.loadString();
  const resortsHTML = site.match(/^<tr class="tr[01]">[\s\S]*?<\/tr>/gm);
  const resorts = resortsHTML.map(convertToObject);

  return resorts.find((x) => x.resort === resort);
}

function getLocalizedRequestURL() {
  const lang = Device.language();

  switch (lang) {
    case 'de':
      return 'http://www.bergfex.at/oesterreich/schneewerte/';
    case 'fr':
      return 'https://www.bergfex.fr/oesterreich/schneewerte/';
    case 'it':
      return 'https://it.bergfex.com/oesterreich/schneewerte/';
    case 'en':
      return 'https://www.bergfex.com/oesterreich/schneewerte/';
    case 'es':
      return 'https://www.bergfex.es/oesterreich/schneewerte/';
    case 'sk':
      return 'https://sk.bergfex.com/oesterreich/schneewerte/';

    default:
      return 'https://www.bergfex.com/oesterreich/schneewerte/';
  }
}

function convertToObject(html) {
  const tmp = html.replace(/(<([^>]+)>)/gi, '');
  var lines = tmp.replace(/^\n/gm, '').split('\n');
  // replace '-' with '0'
  lines = lines.map((x) => (x == '-' ? '0' : x));
  // remove cm from summit height
  if (typeof lines[2] === 'string') {
    lines[2] = lines[2].match(/\d+/)[0];
  }
  // fix missing lifts data
  if (lines.length == 6) {
    lines.splice(4, 0, '0');
  }
  return {
    resort: lines[0],
    valley: lines[1],
    summit: lines[2],
    lifts: lines[4],
    date: lines[5],
  };
}
