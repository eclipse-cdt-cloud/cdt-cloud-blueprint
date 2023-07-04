# Example Workspace with Clangd Contexts

This is a simple multi-project workspace that has two different _clangd contexts_ that should be properly handled by code completion suggestions and warnings in the code editor.

## How to Build the Workspace

Make sure that you have `gcc` from the GNU toolchain and `cmake` on the `PATH`.
Then open a terminal in CDT Cloud Blueprint and build the workspace using

```console
./build.sh
```

It will build the `CMakeLists.txt` in two flavors, for two different architectures, each with its own `compile_commands.json`:

```text
  app/
    Debug_x86-64/
    Release_Atom/
  lib/
    Debug_x86-64/
    Release_Atom/
```

This is interesting because the built-in defined symbols differ.
In `main.c` there are different warnings depending on the built-in defined symbols and the definition of the `TestStruct_t` is different depending on the target architecture.

Line 22 will generate a warning in the `Atom` configurations, but not in the others because in those, the `__atom__` macro is not defined (not being built specifically for that CPU).

## Using the Example VS Code Extension

The example workspace contains two projects, `app/` and `lib/`.
If we have a look at the `app/main.c` file we can see a compilation error because the reference to a name defined in the `lib/` project cannot be resolved.
To fix this a build configuration needs to be set.

> **Note** that until the example workspace has first been built [according to these instructions](#how-to-build-the-workspace), VS Code will not be able to show any build configurations to choose because the context directories containing the requisite makefiles and compilation databases do not yet exist.

This can be done via the command palette using the `Clangd: Change build configuration` command.
Alternatively, the build configuration can be configured by clicking on the build configuration item on the status bar.

> **Note** that the `Clangd: Change build configuration` command also restarts the clangd language server to apply the configuration changes.
> Some errors regarding rejected promises may be thrown by restarting the language server.
> However, they are harmless and can safely be ignored.

Clangd uses a dedicated cache per build configuration index, which means that switching between configurations does not require a full re-indexing.

The `Debug_x86-64` configuration uses a GCC-specific compile flag which is not recognized by clangd.
To avoid errors related to unsupported GCC compile flags the `Clangd: Suppress unsupported GCC flags"` command can be used.
It is also possible to suppress GCC flags only in a specific subdirectory.
Simply select the directory in the file explorer, open the context menu and select `Clangd: Suppress unsupported GCC flags"`.
The `cdtcloud-clangd-contexts-ext` extension then recursively collects all `.clangd` configuration files that are located within the workspace or within the selected directory and adds a configuration option that tells the clangd server to suppress the unsupported compilation flags.

## Context-sensitive Variation Points

### Context

The example workspace comprises two projects (`lib/` and `app/`) that each have potentially four different contexts on a 2x2 matrix of debug or release mode for generic x86-64 or Intel Atom CPU architectures.
These contexts collect their makefiles and `compile_commands.json` files in a flat directory structure within each project:

```text
  app/
    Debug_x86-64/
    Release_Atom/
  lib/
    Debug_x86-64/
    Release_Atom/
```

### Header Files

Setting the context to use in the project lets clangd resolve header files correctly:

- open header files show information based on built-in defined symbols and "generic project-wide" compilation flags used for every file in the project
  - e.g. `-march=x86-64` vs `-march=atom` compiler flags yield different `#ifdef __atom__` conditional compilation

### GCC Flags Filtering

The compilation commands in the `compile_commands.json` databases of some build configurations can include flags supported by GCC that the clang toolchain used by clangd does not understand.
The clangd configuration can specify flags that should be suppressed in the invocation of the clang compiler:

- e.g. `-fstack-usage` is a GCC flag used when compiling that yields an error for `clangd` because it is not supported by the clang compiler
- remove/filter GCC-specific flags to be clang compatible to avoid false errors for things that don't really matter for indexing
- add clang-specific flags as necessary to support clangd's analysis of the code

> **Note** that on Mac platform, the `gcc` compiler provided by Xcode is actually based on `clang`, and so building the project via `build.sh` will also show the unrecognized `-fstack-usage` flag errors.
> These can be ignored for the purposes of the example.
