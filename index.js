const path = require('path');
const _ = require('lodash');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const DEFAULT_VERSION = '36.0';
const TEMPLATE_DIR = path.join(__dirname, 'templates');

const zipDir = (dir, dest, callback) => {
	var fs = require('fs');
	var archiver = require('archiver');

	var output = fs.createWriteStream(dest);
	var archive = archiver('zip');

	output.on('close', callback);
	archive.on('error', (err) => {
		throw err;
	});
	archive.pipe(output);
	archive.directory(dir, '/');
	archive.finalize();
};

function Plugin(options) {
	this.options = options;
	if (!options.outputDir) {
		throw Error('option "outputDir" is required');
	}
	if (!options.files || !_.isArray(options.files)) {
		throw Error('option "files" must be an array');
	}
	this.options = _.extend({
		apiVersion: DEFAULT_VERSION,
		meta: true,
		_xmlns: 'http://soap.sforce.com/2006/04/metadata',
		_package: {}
	}, this.options);
};

Plugin.TEMPLATE_DIR = TEMPLATE_DIR;

Plugin.prototype.apply = function (compiler) {
	this.options.files.forEach((options) => {
		this[options.template](_.extend(this.options, options), compiler);
	});
	// Pack dist dir into static resource bundle
	if (this.options.distDir) {
		compiler.plugin('after-emit', (compilation, callback) => {
			const dest = path.join(this.options.outputDir, 'staticResources', this.options.apiName + '.resource');
			zipDir(this.options.distDir, dest, () => {
				callback();
			});
		});
	}
};

Plugin.prototype.getFullPath = function (directory, filename) {
	return path.join(this.options.outputDir, directory, filename);
};

Plugin.prototype.addPackageMember = function (type, member) {
	if (this.options._package[type] == null) {
		this.options._package[type] = [];
	}
	this.options._package[type].push(member);
	return this.options._package;
};

Plugin.prototype.Package = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'package.xml.jade');
	opts.filename = path.join(this.options.outputDir, 'package.xml');

	new HtmlWebpackPlugin(opts).apply(compiler);
};

Plugin.prototype.ApexPageMeta = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexPage', 'meta.xml.jade');
	opts.filename = this.getFullPath('pages', `${path.basename(options.filename)}-meta.xml`);
	opts._package = this.addPackageMember('ApexPage', path.basename(options.filename, '.page'));

	new HtmlWebpackPlugin(opts).apply(compiler);
};

Plugin.prototype.SinglePageApp = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexPage', 'SinglePageApp.page.jade');

	if (opts.apiName == null) {
		opts.apiName = 'SinglePageApp';
	}
	opts.filename = this.getFullPath('pages', `${options.apiName}.page`);

	if (opts.controller !== false) {
		opts.controller = _.extend({
			apiName: options.apiName + 'Controller',
			sharing: 'with',
			testClass: true
		}, opts.controller);
	}

	opts = _.extend({
		mobile: false,
		title: 'Visualforce App',
		unsupportedBrowser: false
	}, opts);

	new HtmlWebpackPlugin(opts).apply(compiler);

	if (this.options.meta) {
		this.ApexPageMeta(opts, compiler);
	}
	if (opts.controller) {
		this.SinglePageAppController(opts, compiler);
	}
	if (this.options.meta) {
		this.Package(opts, compiler);
		this.StaticResourceMeta(opts, compiler);
	}
};

Plugin.prototype.SinglePageAppDev = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexPage', 'SinglePageAppDev.page.jade');

	if (opts.apiName == null) {
		opts.apiName = 'SinglePageApp';
	}
	opts.filename = path.join(this.options.outputDir, `${options.apiName}.page`);

	opts.controller = _.extend({
		apiName: options.apiName + 'Controller',
	}, opts.controller);

	opts = _.extend({
		mobile: false,
		title: 'Visualforce App',
		unsupportedBrowser: false
	}, opts);

	new HtmlWebpackPlugin(opts).apply(compiler);
};

Plugin.prototype.ApexClassMeta = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexClass', 'meta.xml.jade');
	opts.filename = this.getFullPath('classes', `${path.basename(options.filename)}-meta.xml`);
	opts._package = this.addPackageMember('ApexClass', path.basename(options.filename, '.cls'));

	new HtmlWebpackPlugin(opts).apply(compiler);
};

Plugin.prototype.SinglePageAppController = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexClass', 'SinglePageAppController.cls.ejs');
	opts.filename = this.getFullPath('classes', `${options.controller.apiName}.cls`);

	switch (opts.controller.sharing) {
		case 'with':
			opts.controller._sharing = 'with sharing';
			break;
		case 'without':
			opts.controller._sharing = 'without sharing';
			break;
		case 'inherit':
			opts.controller._sharing = '';
			break;
		default:
			opts.controller._sharing = 'with sharing';
	}

	new HtmlWebpackPlugin(opts).apply(compiler);

	if (this.options.meta) {
		this.ApexClassMeta(opts, compiler);
	}
	if (opts.controller.testClass) {
		this.SinglePageAppControllerTest(opts, compiler);
	}
};

Plugin.prototype.SinglePageAppControllerTest = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'ApexClass', 'SinglePageAppControllerTest.cls.ejs');
	opts.filename = this.getFullPath('classes', `${options.controller.apiName}Test.cls`);

	new HtmlWebpackPlugin(opts).apply(compiler);

	if (this.options.meta) {
		this.ApexClassMeta(opts, compiler);
	}
};

Plugin.prototype.StaticResourceMeta = function (options, compiler) {
	var opts = _.clone(options);
	opts.inject = false;
	opts.template = path.join(TEMPLATE_DIR, 'StaticResource', 'meta.xml.jade');
	opts.filename = this.getFullPath('staticResources', `${options.apiName}.resource-meta.xml`);
	opts._package = this.addPackageMember('StaticResource', options.apiName);

	new HtmlWebpackPlugin(opts).apply(compiler);
};

module.exports = Plugin;
