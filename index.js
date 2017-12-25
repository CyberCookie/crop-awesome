#!/usr/bin/env node
'use strict';

const fs        = require('fs'),
    readline    = require('readline'),

    crop        = require('./source'),
    _helper       = require('./source/_helper'),

    DEFAULT_CFG = {
        __logs: true,
        css_dest: './crop-awesome.css',
        font_dest: './',
        font_types: [],
        icons: [],
        help_classes: ['lg', '2x', '3x', '4x', '5x', 'fw', 'border'],
        css_font_path: ''
    },

    main = cfg => {
        const config = _helper.updatePaths( Object.assign(DEFAULT_CFG, cfg) )
        if (_helper.validateConfig(config)) {
            return crop(config).then(
                css => {
                    if (module.parent) {
                        return { 
                            css, 
                            css_dest: config.css_dest
                        }
                    } else {
                        fs.writeFile(config.css_dest, css, err => 
                            err 
                                ?   _helper.log.e(err) 
                                :   _helper.log.i('Created ' + config.css_dest))
                    }
                }
            ).catch(err => { _helper.log.e(err) })
        } else {
            _helper.log.e('Config doesn`t pass the requirements')
        }
    };

if (!module.parent) {
    const params = process.argv.slice(2, process.argv.lenght).join(' '),
        noLogParam = '--no-log',
        cssPathParam = '-css-dest=',
        fontPathParam = '-font-dest=',
        cfgPathParam = '-cfg-path=',

        extractPath = param => params.match( RegExp(`${param}(\\S*)`) )[1];

    if (params.includes(cfgPathParam)) {
        const configPath = extractPath(cfgPathParam);

        if (configPath.endsWith('.js') || configPath.endsWith('.json')) {
            var configFile;
            try { configFile = require(configPath) } catch(e){_helper.log.e(e)}

            configFile.crop_awesome_cfg
                ?    main(configFile.crop_awesome_cfg)
                :    _helper.log.e('External config file must have [crop_awesome_cfg] key on the root level')
        } else {
            _helper.log.e(`[${cfgPathParam}] must end with .js or .json`)
        }
    } else {
        _helper.setDialogQuestions([
            {
                key: 'font_types',
                question: 'Font types (woff woff2 eot ttf otf svg):',
                transform: str => str.split(' ')
            },
            {
                key: 'icons',
                question: 'Icons:',
                transform: str => str.split(' ')
            },      
            {
                key: 'help_classes',
                question: 'Help classes (default: lg 2x 3x 4x 5x fw border):',
                transform: str => str.split(' ')
            },
            {
                key: 'css_font_path',
                question: 'font-awesome fonts path in CSS file (default: ./ ):',
                transform: str => str
            }
        ]);
        _helper.setSoftValidationMode();

        _helper.prompt(DEFAULT_CFG, (answers, promptCache) => {
            params.includes(cssPathParam) && (answers.css_dest = extractPath(cssPathParam))
            params.includes(fontPathParam) && (answers.font_dest = extractPath(fontPathParam))
            params.includes(noLogParam) && (answers.__logs = false)

            main(answers);

            fs.writeFile(_helper._paths.prompt_cache, JSON.stringify(promptCache), err => {
                err ? _helper.log.e(err) : process.exit(2)
            })
        })
    }
}

module.exports = async user_config => main(user_config)
