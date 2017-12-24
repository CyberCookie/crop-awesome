'use strict';

const readline = require('readline'),
    { join, parse, relative, sep, isAbsolute, normalize } = require('path'),
    { stdin, stdout } = process,

    pkg = require('../package.json'),

    c_reset         = '\x1b[0m',
    c_err           = '\x1b[31m',
    c_warn          = '\x1b[33m',
    c_info          = '\x1b[32m',
    c_dialog_info   = '\x1b[0;1m',
    c_dialog_answer = c_info,

    log = {
        e: str => {
            throw Error(`${c_err}${str}${c_reset}`)
        },
        w: str => console.log(`${c_warn}\t${str}${c_reset}`),
        i: str => LOGS_FLAG && console.log(`${c_info}\t${str}${c_reset}`)
    },

    cwd = process.cwd(),

    font_awesome_version = pkg.dependencies['font-awesome'],
    font_awesome_path = join(__dirname, '..', `${pkg._resolved ? '..' : 'node_modules'}`, 'font-awesome'),

    _paths = {
        font_awesome_svg: join(font_awesome_path, 'fonts', 'fontawesome-webfont.svg'),
        font_awesome_otf: join(font_awesome_path, 'fonts', 'FontAwesome.otf'),
        font_awesome_css: join(font_awesome_path, 'css', 'font-awesome.min.css'),
        cache: join(__dirname, '_cache.json'),
        prompt_cache: join(__dirname, '_prompt_cache.json')
    },

    setDialogQuestions = dialog => DIALOG = dialog,
    setSoftValidationMode = () => SOFT_VALIDATION_MODE = true,
    getFontAwesomeVersion = () => font_awesome_version;

var LOGS_FLAG = true,
    DIALOG = [],
    SOFT_VALIDATION_MODE = false;

var prompt_cache = {};
try {prompt_cache = require('./_prompt_cache')} catch(e) {}

function validateConfig(cfg) {
    const { css_dest, font_dest, css_font_path, help_classes, font_types, icons, __logs } = cfg;

    var isValid = true;

    LOGS_FLAG = Boolean(__logs)

    if (!SOFT_VALIDATION_MODE) {
        const isValidTypes = Array.isArray(font_types),
            isValidIcons = Array.isArray(icons),
            isValidHelpClasses = Array.isArray(help_classes),
            isValidCSSPath = typeof css_font_path == 'string',
            isValidFontPath = typeof font_dest == 'string',

            isValidOutput = typeof css_dest == 'string' && css_dest.endsWith('.css');
        if (!isValidOutput) {
            (typeof css_dest == 'string')
                ?   log.e(`[css_dest] must end with .css, got ${css_dest}`)
                :   log.e(`[css_dest] must be string, got ${typeof css_dest}`)
        }

        isValidTypes || log.e(`[font_types] must be array, got ${typeof font_types}`)
        isValidIcons || log.e(`[icons] must be array, got ${typeof icons}`)
        isValidHelpClasses || log.e(`[help_classes] must be array, got ${typeof help_classes}`)
        isValidCSSPath  || log.e(`[css_font_path] must be string, got ${typeof css_font_path}`) 
        isValidFontPath || log.e(`[font_dest] must be string, got ${typeof font_dest}`)

        isValid = isValidTypes && isValidIcons && isValidHelpClasses 
            && isValidOutput && isValidCSSPath && isValidFontPath;
    }

    if (isValid) {
        LOGS_FLAG && (font_types.length || log.w('Your font list is empty.'))
        LOGS_FLAG && (icons.length || log.w('Your icon list is empty.'))
        LOGS_FLAG && (help_classes.length || log.w('Your help class list is empty. Using default set.'))
    }

    return isValid
}

function prompt(cfg, cb, i=0, res={}) {
    if (i < DIALOG.length) {
        const { key, question, transform } = DIALOG[i],
            cachedAnswer = prompt_cache[key] || '',
            formattedQuestion = [
                `\n${c_reset}`,
                question,
                cachedAnswer && `\n${c_dialog_info}Press Tab to paste cached - ${cachedAnswer}${c_reset}`,
                `\n${c_dialog_answer}`
            ].join(''),
        rl = readline.createInterface(stdin, stdout, line => [[cachedAnswer], line]);

        rl.question(formattedQuestion, answer => {
            rl.close();

            answer = answer.trim()
            prompt_cache[key] = answer
            res[key] = answer ? transform(answer) : cfg[key]

            prompt(cfg, cb, ++i, res)
        });
    } else {
        console.log(c_reset)
        cb(res, prompt_cache)
    }
}

function updatePaths(config) {
    let { css_dest, font_dest, css_font_path } = config;

    isAbsolute(css_dest)
        ?   (css_dest = normalize(css_dest))
        :   (css_dest = join(cwd, css_dest))

    isAbsolute(font_dest)
        ?   (font_dest = normalize(font_dest))
        :   (font_dest = join(cwd, parse(font_dest).dir) + sep)

    if (!css_font_path) {
        css_font_path = relative(parse(css_dest).dir, font_dest)
            .replace(/\\\\|\\/g, '/')
    }

    return Object.assign(config, { css_dest, font_dest, css_font_path })
}

module.exports = { 
    prompt, log, validateConfig, _paths,
    setDialogQuestions, setSoftValidationMode,
    updatePaths, getFontAwesomeVersion
}
