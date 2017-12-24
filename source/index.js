'use strict';

const fs      = require('fs'),

    svg2ttf   = require('svg2ttf'),
    ttf2woff  = require('ttf2woff'),
    ttf2woff2 = require('ttf2woff2'),
    ttf2eot   = require('ttf2eot'),

    { log, getFontAwesomeVersion, _paths } = require('./_helper');

var cache = {};
try {cache = require('./_cache.json')} catch(e) {}

function createFonts(glyphs, config) {
    let { font_types, css_dest, font_dest } = config

    fs.readFile(_paths.font_awesome_svg, 'utf-8', (err, file) => {
        if (err) {
            log.e(err)
        } else if (glyphs.length) {
            var getSvgGlyph = new RegExp(`(\\<.*?(${glyphs.join('|')})(.|\\s)*?\\/\\>)`, 'g'),
                SVGFont = (/(\<(\s|\S)*)\<missing-glyph/).exec(file)[1] //: extract svg font data
                    .replace(/\<metadata\>(\w|\W)*\<\/metadata\>/g, ''),
                result;
            
            while (result = getSvgGlyph.exec(file)) {
                SVGFont += result[0]
            }
            SVGFont += '</font></defs></svg>';

            var ttfFont = svg2ttf(SVGFont, {}).buffer,
                fontGet = {
                    svg: () => SVGFont,
                    ttf: ttf => ttf,
                    woff2: ttf => ttf2woff2(ttf), //: this one takes ~0.65
                    woff: ttf => ttf2woff(ttf).buffer,
                    eot: ttf => ttf2eot(ttf),
                };
            var indexOTF = font_types.indexOf('otf')
            if (indexOTF >= 0) {
                let destination = `${font_dest}FontAwesome.${font_types[indexOTF]}`;

                font_types.splice(indexOTF, 1)

                fs.createReadStream(_paths.font_awesome_otf)
                    .pipe(fs.createWriteStream(destination))

                log.i(`Created ${destination}`)
            }

            font_types.forEach(format => {
                let destination = `${font_dest}fontawesome-webfont.${format}`;

                fontGet[format]
                    ?   fs.writeFile(destination, fontGet[format](ttfFont), err => {
                            err 
                                ?   log.e(`Error occured during the [${format}] font processing\n${err}`)
                                :   log.i(`Created ${destination}`)
                        })
                    :   log.w(`There is no such font as [${format}]`)
            })
        } else {
            log.w('There are no icon glyphs to create any font.')
        }
    })
}

function extractDataFromFontAwesome(config, CSSSource) {
    const prefix = '.fa',
        allFonts = ['otf', 'woff', 'ttf', 'svg', 'woff2', 'eot'],
        fontFaceSelector = '@font-face';

    var { font_types, icons, help_classes, css_font_path } = config,
        removeFonts = allFonts.filter(font => !font_types.includes(font)),
        fontFaceContent = CSSSource[fontFaceSelector];

    if (!removeFonts.length) {
        let fontsClean = new RegExp(`(url\\S*\\.(${removeFonts.join('|')})\\?[\\S|\\s]*?format.*?\\)\\,?)`, 'g')

        fontFaceContent = fontFaceContent.replace(fontsClean, '').replace(',;', ';')
    }
    fontFaceContent = fontFaceContent.replace(/\.\.\/fonts/g, css_font_path);

    var CSS = `${fontFaceSelector}{${fontFaceContent}}${prefix}{${CSSSource[prefix]}}`,
        glyphCodeExtractRegExp = /content\:\"\\(\w+)/,
        glyphs = [],
        selectedClasses = icons.concat(help_classes);

    Object.keys(CSSSource).forEach(selector => {
        selectedClasses.forEach((classToInclude, i) => {
            if (selector.includes(classToInclude)) {
                CSS += `${selector}{${CSSSource[selector]}}`

                var glyph = glyphCodeExtractRegExp.exec(CSSSource[selector])
                glyph && glyphs.push(glyph[1])

                selectedClasses.splice(i, 1)
            }
        })
    })

    selectedClasses.length
        &&  selectedClasses.forEach(wrongClass => log.w(`Wrong class: ${wrongClass}`))

    return { CSS, glyphs }
}

module.exports = async config => {
    const FA_VERSION = getFontAwesomeVersion();

    if (cache.FA_VERSION != FA_VERSION) {
        var file = fs.readFileSync(_paths.font_awesome_css),
            classExtractRegExp = /([\.|\@]\S*?)\{(.*?)\}/g,
            result,
            FA_CLASSES = {};

        cache = { FA_VERSION, FA_CLASSES }

        while (result = classExtractRegExp.exec(file)) {
            cache.FA_CLASSES[result[1]] = result[2]
        }

        fs.writeFile(_paths.cache, JSON.stringify(cache), err => {
            err && log.e(err)
        })
    }
    
    var { CSS, glyphs } = extractDataFromFontAwesome(config, cache.FA_CLASSES)

    config.font_types.length && createFonts(glyphs, config)

    return CSS
}
