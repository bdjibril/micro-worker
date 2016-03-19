gruntFunction = (grunt) ->

  gruntConfig =
    pkg: 
      grunt.file.readJSON "package.json"
    
    coffee:
      app:
        expand: true
        flatten: true
        cwd: "src"
        src: ["*.coffee"]
        dest: "lib/"
        ext: ".js"
      test:
        expand: true
        flatten: true
        cwd: "test/src"
        src: ["*.coffee"]
        dest: "test/"
        ext: ".js"
    
    coffeelint:
      app:
        src: "src/*.coffee"
      test:
        src: "test/src/*.coffee"
      options:
        configFile: "coffeelint.json"
  
  grunt.initConfig gruntConfig
  
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-coffeelint"


  grunt.registerTask "lint", "coffeelint"
  
  grunt.registerTask "default", ["lint", "coffee"]
  
module.exports = gruntFunction