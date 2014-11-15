module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      dev: {
        options: {
          port: 8888,
          base: 'dev-tmp',
          livereload: true
        }
      },
      test: {
        options: {
          port: 8889,
          base: 'dist',
          keepalive: true // keep the grunt process alive
        }
      }
    },
    compass: {
      dist: {
        options: {
          sassDir: '.build-tmp/sass',
          cssDir: '.build-tmp/css',
          environment: 'production',
          outputStyle: 'compressed'
        }
      },
      dev: {
        options: {
          sassDir: 'src/sass',
          cssDir: 'dev-tmp/css'
        }
      }
    },
    clean: {
      dist: ['dist/'],
      temp: ['.build-tmp/'],
      package: ['dist-packaged/']
    },
    copy: {
      dev: {
        expand: true,
        cwd: 'src/',
        src: [
          '**',
          '!css/**/*',
          '!html/**/*',
          '!sass/**/*'
        ],
        dest: 'dev-tmp'
      },
      // Copy files to temporary location
      temp: {
        expand: true,
        cwd: 'src/',
        src: [
          '**',
          '!css/**/*'
        ],
        dest: '.build-tmp/'
      },

      // Copy files from temporary location to the `dist` directory
      dist: {
        expand: true,
        cwd: '.build-tmp/',
        src: [
          '**',

          // These are packaged by RequireJS.
          '!js/almond*.js',
          '!js/app/**',

          '!sass/**', // SASS source is not needed. Only CSS.
          '!vendor/**', // These are included by SASS and RequireJS
          '!templates/**', // Templates are bundled with RequireJS package
          '!html/**' // Bake compiles html
        ],
        dest: 'dist/'
      },

      // Copy uncompressed image filed to `dist-packaged`. All other files are copies by the
      // compress task
      package: {
        expand: true,
        cwd: 'dist/',
        src: [
          'favicon.ico',
          'images/*',
          'images/vendor/*',
          'images/favicons/*'
        ],
        dest: 'dist-packaged/'
      }

    },
    watch: {
      bake: {
        files: ['src/html/**'],
        tasks: 'bake:dev',
        options: {
          atBegin: true,
          livereload: true
        }
      },
      css: {
        files: '**/*.scss',
        tasks: ['compass:dev'],
        options: {
          atBegin: true,
          livereload: true
        }
      },
      configFiles: {
        files: [ 'Gruntfile.js' ],
        options: {
          reload: true
        }
      },
      assets: {
        files: ['src/**', '!src/html/**', '!src/sass/**'],
        options: {
          atBegin: true,
          livereload: true
        },
        tasks: 'copy:dev'
      }
    },
    htmlmin: {
      dist: {
        options:
        { removeComments: true
        , collapseWhitespace: true
        , conservativeCollapse: true
        , preserveLineBreaks: true
        , collapseBooleanAttributes: true
        , removeRedundantAttributes: true
        , removeEmptyAttributes: true
        , ignoreCustomComments: [/VERSION/]
        },
        files: [{
          expand: true,
          cwd: '.build-tmp/',
          src: '*.html',
          dest: '.build-tmp/'
        }]
      }
    },
    revision: { /* Default options are just fine */ },
    filerev: {
      options: {
        algorithm: 'md5',
        length: 8
      },

      // WARNING! Do NOT use expand: true in filerev task. It seems to be unable to delete
      // the originals if expand is true
      images: { src: '.build-tmp/images/*' },
      vendor: { src: '.build-tmp/images/vendor/*' },
      icons: { src: '.build-tmp/images/icons/*' },
      svg: { src: '.build-tmp/images/svg/*' },
      css: { src: '.build-tmp/css/*' },
      js: { src: '.build-tmp/js/*' },
      fonts: { src: ['.build-tmp/fonts/webfonts/*'] }
    },
    usemin: {
      html: '.build-tmp/*.html',
      css: '.build-tmp/css/style.*.css'
    },
    requirejs: {
      compile: {
        options: {
          mainConfigFile: ".build-tmp/js/app.js",
          out: ".build-tmp/js/app.js",
          include: "app",
          name: "almond",
          insertRequire: ['app/main']
        }
      }
    },
    replace: {
      requirejs: {
        src: ['.build-tmp/*.html'],
        overwrite: true,
        replacements: [{
          from: '<script data-main="js/app" src="vendor/require.js"></script>',
          to: '<script src="js/app.js"></script>'
        }]
      },
      version: {
        src: ['.build-tmp/*.html'],
        overwrite: true,
        replacements: [{
          from: '<!-- VERSION -->',
          to: function() {
            return '<!-- VERSION ' + grunt.config('meta.revision') + ' at ' + new Date() + ' -->';
          }
        }]
      },
      prodendpoint: {
        src: ['.build-tmp/js/app/trial-form.js'],
        overwrite: true,
        replacements: [{
          from: "var CATCH_ST_URL = 'http://catch.sharetri.be/int_api';",
          to: "var CATCH_ST_URL = 'https://catch.sharetribe.com/int_api';"
        }]
      }
    },
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        files: [
          {expand: true, cwd: 'dist/', src: [
            '*.html',
            'js/*',
            'css/*',
            'fonts/**/*',
            'images/svg/*',
            'images/icons/*'
          ], dest: 'dist-packaged/'}
        ]
      }
    },
    aws: grunt.file.readJSON('aws-keys.json'),
    aws_s3: {
      options: {
        accessKeyId: '<%= aws.AWSAccessKeyId %>', // Use the variables
        secretAccessKey: '<%= aws.AWSSecretKey %>', // You can also use env variables
        uploadConcurrency: 5, // 5 simultaneous uploads
        downloadConcurrency: 5 // 5 simultaneous downloads
      },
      staging: {
        options: {
          bucket: 'www.sharetri.be',
          differential: true // Only uploads the files that have changed
        },
        files: [
          // Compressed files with long cache expiration
          {expand: true, cwd: 'dist-packaged/', src: [
            'js/*',
            'css/*',
            'images/svg/*',
            'images/icons/*',
            'fonts/**/*'
          ], dest: '', params: {
            ContentEncoding: "gzip",
            CacheControl: "max-age=" + 3600 * 24 * 365 + "" // One year
          }},

          // Not compressed filed with long cache expiration
          {expand: true, cwd: 'dist-packaged/', src: [
            'images/*',
            'images/vendor/*',
            'favicon.ico',
            'images/favicons/*'
          ], dest: '', params: {
            CacheControl: "max-age=" + 3600 * 24 * 365 + "" // One year
          }},

          // Compressed files without cache
          {expand: true, cwd: 'dist-packaged/', src: ['*.html'], dest: '', params: {
            ContentEncoding: "gzip"
          }},

          // Cleanup all old files. If differential: true, this deletes only
          // files that do not exists locally
          {cwd: 'dist-packaged/', dest: '/', action: 'delete'}
        ]
      },
      production: {
        options: {
          bucket: 'www.sharetribe.com',
          differential: true // Only uploads the files that have changed
        },
        files: [
          // Compressed files with long cache expiration
          {expand: true, cwd: 'dist-packaged/', src: [
            'js/*',
            'css/*',
            'fonts/**/*',
            'images/svg/*',
            'images/icons/*'
          ], dest: '', params: {
            ContentEncoding: "gzip",
            CacheControl: "max-age=" + 3600 * 24 * 365 + "" // One year
          }},

          // Not compressed filed with long cache expiration
          {expand: true, cwd: 'dist-packaged/', src: [
            'images/*',
            'images/vendor/*',
            'favicon.ico',
            'images/favicons/*'
          ], dest: '', params: {
            CacheControl: "max-age=" + 3600 * 24 * 365 + "" // One year
          }},

          // Compressed files without cache
          {expand: true, cwd: 'dist-packaged/', src: ['*.html'], dest: '', params: {
            ContentEncoding: "gzip"
          }},

          // Cleanup all old files. If differential: true, this deletes only
          // files that do not exists locally
          {cwd: 'dist-packaged/', dest: '/', action: 'delete'},
        ]
      }
    },
    bake: {
      dev: {
        options: {
          basePath: "src/html/"
        },
        files: {
          "dev-tmp/404.html": "src/html/404.html",
          "dev-tmp/about.html": "src/html/about.html",
          "dev-tmp/casaguau.html": "src/html/casaguau.html",
          "dev-tmp/contact.html": "src/html/contact.html",
          "dev-tmp/features.html": "src/html/features.html",
          "dev-tmp/index.html": "src/html/index.html",
          "dev-tmp/maggieskidmarket.html": "src/html/maggieskidmarket.html",
          "dev-tmp/press.html": "src/html/press.html",
          "dev-tmp/pricing.html": "src/html/pricing.html",
          "dev-tmp/privacypolicy.html": "src/html/privacypolicy.html",
          "dev-tmp/stories.html": "src/html/stories.html",
          "dev-tmp/termsofuse.html": "src/html/termsofuse.html",
          "dev-tmp/thequiver.html": "src/html/thequiver.html"
        }
      },
      dist: {
        options: {
          basePath: ".build-tmp/html/"
        },
        files: {
          ".build-tmp/404.html": ".build-tmp/html/404.html",
          ".build-tmp/about.html": ".build-tmp/html/about.html",
          ".build-tmp/casaguau.html": ".build-tmp/html/casaguau.html",
          ".build-tmp/contact.html": ".build-tmp/html/contact.html",
          ".build-tmp/features.html": ".build-tmp/html/features.html",
          ".build-tmp/index.html": ".build-tmp/html/index.html",
          ".build-tmp/maggieskidmarket.html": ".build-tmp/html/maggieskidmarket.html",
          ".build-tmp/press.html": ".build-tmp/html/press.html",
          ".build-tmp/pricing.html": ".build-tmp/html/pricing.html",
          ".build-tmp/privacypolicy.html": ".build-tmp/html/privacypolicy.html",
          ".build-tmp/stories.html": ".build-tmp/html/stories.html",
          ".build-tmp/termsofuse.html": ".build-tmp/html/termsofuse.html",
          ".build-tmp/thequiver.html": ".build-tmp/html/thequiver.html"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-debug-task');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-bake');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  /**
    Task to build a distribution package. Outputs to `dist` directory.

    The main idea of the build is this:

    1. Copy all files from `src` to `.build-tmp`
    2. In the `.build-tmp` directory, do all the necessary minifications and revving
    3. Copy necessary files from `.build-tmp` to `dist`
  */
  grunt.registerTask('build', [
    'clean',
    'copy:temp',
    'bake:dist',
    'revision',
    'replace:version',
    'requirejs:compile',
    'replace:requirejs',
    'compass:dist',
    'filerev',
    'usemin',
    'htmlmin',
    'copy:dist'
  ]);

  grunt.registerTask('build-prod', [
    'clean',
    'copy:temp',
    'bake:dist',
    'revision',
    'replace:version',
    'replace:prodendpoint',
    'requirejs:compile',
    'replace:requirejs',
    'compass:dist',
    'filerev',
    'usemin',
    'htmlmin',
    'copy:dist'
  ]);

  grunt.registerTask('package', [
    'compress',
    'copy:package'
  ]);

  grunt.registerTask('print-staging', function () {
    grunt.log.write("Done. Check the deployed staging content at: http://www.sharetri.be.s3-website-us-east-1.amazonaws.com/");
  });

  grunt.registerTask('deploy-staging', [
    'aws_s3:staging',
    'print-staging'
  ]);

  grunt.registerTask('print-production', function () {
    grunt.log.writeln("Production deployment done! \\(^_^)/");
    grunt.log.writeln();
    grunt.log.writeln("Check the deployed production content at: http://www.sharetribe.com.s3-website-us-east-1.amazonaws.com/.");
    grunt.log.writeln("And don't forget to invalidate the CloudFront distribution!");
  });

  grunt.registerTask('deploy-prod', [
    'aws_s3:production',
    'print-production'
  ]);

  grunt.registerTask('dev', [
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('test', [
    'connect:test'
  ]);
};
