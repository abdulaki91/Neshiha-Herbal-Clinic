allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Compile the app and every plugin against Android SDK platform 37.
// Flutter 3.50 defaults to 36, but the current `platforms;android-36`
// package (rev 2) installs without android.jar / core-for-system-modules.jar,
// which breaks Java 17 plugins (file_picker, shared_preferences_android)
// with "Cannot query the value of this provider". Remove this block once a
// fixed android-36 package is available.
subprojects {
    plugins.withId("com.android.library") {
        extensions.configure<com.android.build.api.variant.LibraryAndroidComponentsExtension> {
            finalizeDsl { it.compileSdk = 37 }
        }
    }
}
// (The app module sets compileSdk = 37 in app/build.gradle.kts — it is
// evaluated before this block runs.)

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
