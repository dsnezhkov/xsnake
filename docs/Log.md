

>>> snakemake.snakemake("Workflow.0x0",  printdag=True, targets=["data/nmap.tbl"], dryrun=True )
Building DAG of jobs...
digraph snakemake_dag {
    graph[bgcolor=white, margin=0];
    node[shape=box, style=rounded, fontname=sans,                 fontsize=10, penwidth=2];
    edge[penwidth=2, color=grey];
	0[label = "glue_nmap2tbl", color = "0.29 0.6 0.85", style="rounded"];
	1[label = "exe_ipr2nmap", color = "0.38 0.6 0.85", style="rounded"];
	2[label = "glue_dnsmap2ipr_merge", color = "0.48 0.6 0.85", style="rounded"];
	3[label = "glue_dnsmap2iplist", color = "0.57 0.6 0.85", style="rounded"];
	4[label = "exe_dnsmap2ipr", color = "0.00 0.6 0.85", style="rounded"];
	1 -> 0
	2 -> 1
	3 -> 2
	4 -> 3
}

>>> snakemake.snakemake("Workflow.0x0",  printdag=True, targets=["glue_nmap2tbl"], dryrun=True )
Building DAG of jobs...
digraph snakemake_dag {
    graph[bgcolor=white, margin=0];
    node[shape=box, style=rounded, fontname=sans,                 fontsize=10, penwidth=2];
    edge[penwidth=2, color=grey];
	0[label = "glue_nmap2tbl", color = "0.29 0.6 0.85", style="rounded"];
	1[label = "exe_ipr2nmap", color = "0.38 0.6 0.85", style="rounded"];
	2[label = "glue_dnsmap2ipr_merge", color = "0.48 0.6 0.85", style="rounded"];
	3[label = "glue_dnsmap2iplist", color = "0.57 0.6 0.85", style="rounded"];
	4[label = "exe_dnsmap2ipr", color = "0.00 0.6 0.85", style="rounded"];
	1 -> 0
	2 -> 1
	3 -> 2
	4 -> 3
}



snakemake -s Workflow.0x0  --report  -p glue_nmap2tbl

sudo snakemake -s Workflow.0x0 -p glue_nmap2tbl --stats reports/
stats.json --forceall

snakemake -s Workflow.0x0  --report  reports/Workflow.0x0.html  -p glue_nmap2tbl

