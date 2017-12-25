# Crop-awesome
If you are familiar with [Font Awesome](http://fontawesome.io/), you may find this package extremely usefull for you :) Crop awesome is a simplest way to crop fonts and css files as to make them much smaller, removing unneeded icons and classes from CSS file and glyphs from font files. You can  use crop-awesome in many ways because of it flexibility, we are going to go through all of them :)

First let's make an install having executed one of the command below in your terminal.

`npm install crop-awesome` You can install it globally using `-g` flag as well</br>
or</br>
`git clone https://github.com/CyberCookie/crop-awesome`</br>

Crop-awesome installed globally or installed via git uses params and terminal prompt as to construct your config when crop-awesome installed as a package dependency uses passed in object that merges with the default config.
#### Tool execution params

`--no-log` - turns off info logs

`-css-dest=` - relative css destination

`-font-dest=` - relative destination for the font files

`-cfg-path=` - relative path to an extrnal config file. File must be have _json_ or _js_ format

#### Package default config
```js
    {
        __logs: true,
        css_dest: './crop-awesome.css',
        font_dest: './',
        font_types: [],
        icons: [],
        help_classes: ['lg', '2x', '3x', '4x', '5x', 'fw', 'border'],
        css_font_path: ''
    }
```

`__logs` - if false prevents info and warning console outputs

`css_dest` - relative destination to the cropped CSS file. In _dependency package mode_ `css_dest` returns as result along with CSS content 

`font-dest` - relative destination to the font files

`css_font_path` - relative path inside CSS file that uses as a reference to the font files. By default it's equal to relative path between `css_dest` and `font-dest`.

`font_types` - types of font you want to get as a result of pacakge execution. There are six font types you are capable to choose: EOT, TTF, SVG, WOFF, WOFF2 and OTF. Since OTF is a binary font it can't be cropped, specifying it in your config will just copy original OTF file to `font-dest`

`icons` - font icons you want to include in generated CSS and font files. You can ommit _fa-_ prefix. Since Font Awesome has aliases for some of the icons - you can use any alias/name you want in your passing config.

`help_classes` - helper classes such as _2x_, _border_ and so on. I've included the most usefull classes in default set. It includes _lg_, _2x_, _3x_, _4x_, _5x_, _fw_, _border_

#### Examples
`crop-awesome -css-dest=./my_cropped.css -font-dest=./fonts/`
In example above we see the params that set destination to CSS and font files (-css-dest, -font-dest).
In case you omit a params - package get missed properties from the _default config_,
This way of usasge also includes terminal propmt questions in order to build user config. Your answers stores in package therefore you can "autocomplete" them next time.
> So far autocomplete doesn't work in global module

</br>
Here we have the case with external config file:
`crop-awesome -cfg-path=../../config.js`
It's important to have `crop_awesome_cfg` on the root level in your external config as not to polute it.

This is an example of how crop-awesome works being a package dependency
```javascript
const fs = require('fs'),
    crop = require('crop-awesome');

crop({
    font_types: ['woff2'],
    output_path: './lol.css',
    icons: ['glass', 'space', 'infinity', 'taxi']
}).then(
    res => {
        fs.wrireFile(res.output_path, res.css, err => console.log(err))
    },
    err => console.log(err)
)
```

Any improvements are welcomed :)
