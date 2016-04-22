# salesforce-template-webpack-plugin

[![Project Status: Active - The project has reached a stable, usable state and is being actively developed.](http://www.repostatus.org/badges/latest/active.svg)](http://www.repostatus.org/#active)

Extension of HtmlWebpackPlugin with templates for generating Salesforce
metadata.

## Install

```bash
npm i -D jade jade-loader salesforce-template-webpack-plugin
```

## Example configuration

`webpack.config.js`

```javascript
const path = require('path');

const SalesforceTemplateWebpackPlugin =
	require('salesforce-template-webpack-plugin');

const PACKAGE_DIR = path.join(__dirname, 'pkg');

// ...

const webpackConfig = {
	output: {
		path: 'dist',
		filename: 'index_bundle.js'
	},
	module: {
		// required for jade templates
		loaders: [{
			test: /\.jade$/,
			loader: 'jade?pretty=true'
		}]
	},
	plugins: {
		new SalesforceTemplateWebpackPlugin({
			outputDir: PACKAGE_DIR,
			files: [{
				template: 'SinglePageApp'
			}]
		})
	}
}
```

## Plugin Options

These are the minimal plugin options. Template-specific options are listed in the
following section.

- `outputDir`: Path to the base output directory for generated files. Required.
- `distDir`: Path to where the plugin will package resources as a StaticResource zip.
- `files`: `[...]` An array of template options (see below). Required.
- `meta`: `true | false` If true, also generate corresponding `*-meta.xml` files and `package.xml`. Default is `true`

## Templates

The plugin includes a few default Jade/EJS templates.

- `template`: Name of a template. Required.
- `apiName`: A unique API name for assigning filenames and any references from within templates. Default is the value of `template`
- `apiVersion`: Salesforce API version of the metadata. Default is `36.0`

###### A minimal example

```javascript
new SalesforceTemplateWebpackPlugin({
	files: [{
		template: '<template name>',
		// additional template options
	}]
})
```

### SinglePageApp

A bare-bones Visualforce page and Apex remoting controller for use as a "single page" web app.

- `title`: Title of the page. Default is `'Visualforce App'`
- `mobile`: `true | false` Configure the page as mobile-ready. Default is `false`
- `baseHref`: Set <base href="{value}">
- `unsupportedBrowser`: `true | false` Display a message on unsupported browsers. Default is `false`
- `appMountId`: Create a div element with the id given.
- `appMountIds`: `[...]` Create div elements with the ids given.
- `window`: `{...}` Extend the global window object with defined key-values.
- `devServer`: Path to directory where `webpack-dev-server.js` can be found.
- `googleAnalytics`: `{...}` Google Analytics options:
	- `trackingId`: The account's tracking ID.
	- `pageViewOnLoad`: `true | false` Track page views on load. Default is `false`
- `controller`: `{...} | false` Apex controller options:
	- `apiName`: API name of the controller. Default is 'Controller' appended to the base API name.
	- `sharing`: `with | without` Sets with/without sharing on the controller. Default is `with`.
	- `testClass`: `true | false` Also create a controller test class. Default is `true`
