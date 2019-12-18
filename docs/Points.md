## Highlights
- repeatability
- anomaly in runtime and run assumptions (blue/red/purple). Performance == security == operational context
- logs 
- domain specific checkers
- deltas for unknown asset deployment 

## Notes
1. Hooking into the Python interpreter DSL 
2. flexibility of a plain scripting language with a pythonic workflow definition. 
3. Scheduling algorithm, customizable resources, generic support for distributed computing 
4. Container engine Singularity such that defining the software stack becomes part of the workflow itself.
5. Native Cloud storage

- Snakemake workflow is defined by rules Rules decompose the workflow into small steps, defining dependencies

- Dependencies are outputs. Ask yourself: _What do you want to generate_? and work backwards > DAG
- only re-runs jobs if one of the input files is newer than one of the output files or one of the input files will be updated by another job.
- Snakefiles are in principle Python code enhanced by some declarative statements to define workflow
- Script paths are always relative to the referring Snakefile
- the script logic is separated from the workflow logic (and can be even shared between workflows), but boilerplate code like the parsing of command line arguments is unnecessary.
- Snakemake also accepts rule names as targets
- `conda` is optional but useful to specify environments per rule. Useful: mix python 2/3
- resolved multiple named wildcards are a key feature and strength of Snakemake in comparison to other systems
- Note: `ruleorder` is not intended to bring rules in the correct execution order (this is solely guided by the names of input and output files you use), it only helps snakemake to decide which rule to use when multiple ones can create the same output file. Hovwever!! it makes it clear for the user.


## TODO:

- expose starting rules for DAG
- Available directives of interest:
    `log`
    `benchmark` # anomaly of the run
    `temp`
    `protected`
    `touch`  # flag 
    `version` # rule level
    `localrules`
    `pipe` # Single consumer named pipe 
    `checkpoint`
    `workdir`
    `subworkflow`
    `remote`

    Functions as input files
    Config files and validation of JSON schemas 
    Cluster servers
    `snakemake.remote.S3`
    `snakemake.remote.GS`
    `snakemake.remote.AzureStorage`
    `snakemake.remote.SFTP`
    `snakemake.remote.dropbox`

    Packaging workflows ` --archive tgz`
## Useful
```
snakemake --snakefile main.snake -n -r -l
```

```
touch data/one.in
snakemake --snakefile main.snake -R  `snakemake --snakefile main.snake --list-code-changes`
```