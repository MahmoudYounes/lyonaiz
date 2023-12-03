# Overview
Memory management docs

# Memory arrangement
Since computer hardware is becoming more complicated and more powerful, Memory chips are placed in different areas. hence, access times differ depending on which chip is accessing which memory chip. This was the reason behind non uniform memory access (NUMA).
memory is split into areas > nodes > zones, each zone has a zone type. there is a pg_data_t object defined per zone that encapsulates all the information and allocation for this zone. on simple computers like personal computers there is only on pg_data_t object.
to visualize the memory layout (areas, nodes, zones, etc)

```Bash
$ lstopo   # lists the memory topology
$ lstopo-no-graphics   # lists the memory topology in the command line
$ cat /proc/buddyinfo  # to list the allocated memory via the BSA algorithm per zone per type per order.
```

With the x86 the zones are:

ZONE_DMA	First 16MiB of memory
ZONE_NORMAL	16MiB - 896MiB
ZONE_HIGHMEM	896 MiB - End

``` C
// include/linux/mmzone.h
/*
 * On NUMA machines, each NUMA node would have a pg_data_t to describe
 * it's memory layout. On UMA machines there is a single pglist_data which
 * describes the whole memory.
 *
 * Memory statistics and page replacement data structures are maintained on a
 * per-zone basis.
 */
typedef struct pglist_data {
	/*
	 * node_zones contains just the zones for THIS node. Not all of the
	 * zones may be populated, but it is the full list. It is referenced by
	 * this node's node_zonelists as well as other node's node_zonelists.
	 */
	struct zone node_zones[MAX_NR_ZONES];

	/*
	 * node_zonelists contains references to all zones in all nodes.
	 * Generally the first zones will be references to this node's
	 * node_zones.
	 */
	struct zonelist node_zonelists[MAX_ZONELISTS];

	int nr_zones; /* number of populated zones in this node */

	unsigned long node_start_pfn;
	unsigned long node_present_pages; /* total number of physical pages */
	unsigned long node_spanned_pages; /* total size of physical page
					     range, including holes */
	int node_id;
	wait_queue_head_t kswapd_wait;
	wait_queue_head_t pfmemalloc_wait;

	/* workqueues for throttling reclaim for different reasons. */
	wait_queue_head_t reclaim_wait[NR_VMSCAN_THROTTLE];

	atomic_t nr_writeback_throttled;/* nr of writeback-throttled tasks */
	unsigned long nr_reclaim_start;	/* nr pages written while throttled
					 * when throttling started. */
#ifdef CONFIG_MEMORY_HOTPLUG
	struct mutex kswapd_lock;
#endif
	struct task_struct *kswapd;	/* Protected by kswapd_lock */
	int kswapd_order;
	enum zone_type kswapd_highest_zoneidx;

	int kswapd_failures;		/* Number of 'reclaimed == 0' runs */

	/*
	 * This is a per-node reserve of pages that are not available
	 * to userspace allocations.
	 */
	unsigned long		totalreserve_pages;

#ifdef CONFIG_NUMA
	/*
	 * node reclaim becomes active if more unmapped pages exist.
	 */
	unsigned long		min_unmapped_pages;
	unsigned long		min_slab_pages;
#endif /* CONFIG_NUMA */

	/* Write-intensive fields used by page reclaim */
	CACHELINE_PADDING(_pad1_);

	/* Fields commonly accessed by the page reclaim scanner */

	unsigned long		flags;


	CACHELINE_PADDING(_pad2_);

	/* Per-node vmstats */
	struct per_cpu_nodestat __percpu *per_cpu_nodestats;
	atomic_long_t		vm_stat[NR_VM_NODE_STAT_ITEMS];

} pg_data_t;

```

the zone struct looks like this
```C

struct zone {
	/* Read-mostly fields */

	/* zone watermarks, access with *_wmark_pages(zone) macros */
	unsigned long _watermark[NR_WMARK];
	unsigned long watermark_boost;

	unsigned long nr_reserved_highatomic;

	/*
	 * We don't know if the memory that we're going to allocate will be
	 * freeable or/and it will be released eventually, so to avoid totally
	 * wasting several GB of ram we must reserve some of the lower zone
	 * memory (otherwise we risk to run OOM on the lower zones despite
	 * there being tons of freeable ram on the higher zones).  This array is
	 * recalculated at runtime if the sysctl_lowmem_reserve_ratio sysctl
	 * changes.
	 */
	long lowmem_reserve[MAX_NR_ZONES];


	struct pglist_data	*zone_pgdat;
	struct per_cpu_pages	__percpu *per_cpu_pageset;
	struct per_cpu_zonestat	__percpu *per_cpu_zonestats;
	/*
	 * the high and batch values are copied to individual pagesets for
	 * faster access
	 */
	int pageset_high_min;
	int pageset_high_max;
	int pageset_batch;


	/* zone_start_pfn == zone_start_paddr >> PAGE_SHIFT */
	unsigned long		zone_start_pfn;

	/*
	 * spanned_pages is the total pages spanned by the zone, including
	 * holes, which is calculated as:
	 * 	spanned_pages = zone_end_pfn - zone_start_pfn;
	 *
	 * present_pages is physical pages existing within the zone, which
	 * is calculated as:
	 *	present_pages = spanned_pages - absent_pages(pages in holes);
	 *
	 * present_early_pages is present pages existing within the zone
	 * located on memory available since early boot, excluding hotplugged
	 * memory.
	 *
	 * managed_pages is present pages managed by the buddy system, which
	 * is calculated as (reserved_pages includes pages allocated by the
	 * bootmem allocator):
	 *	managed_pages = present_pages - reserved_pages;
	 *
	 * cma pages is present pages that are assigned for CMA use
	 * (MIGRATE_CMA).
	 *
	 * So present_pages may be used by memory hotplug or memory power
	 * management logic to figure out unmanaged pages by checking
	 * (present_pages - managed_pages). And managed_pages should be used
	 * by page allocator and vm scanner to calculate all kinds of watermarks
	 * and thresholds.
	 *
	 * Locking rules:
	 *
	 * zone_start_pfn and spanned_pages are protected by span_seqlock.
	 * It is a seqlock because it has to be read outside of zone->lock,
	 * and it is done in the main allocator path.  But, it is written
	 * quite infrequently.
	 *
	 * The span_seq lock is declared along with zone->lock because it is
	 * frequently read in proximity to zone->lock.  It's good to
	 * give them a chance of being in the same cacheline.
	 *
	 * Write access to present_pages at runtime should be protected by
	 * mem_hotplug_begin/done(). Any reader who can't tolerant drift of
	 * present_pages should use get_online_mems() to get a stable value.
	 */
	atomic_long_t		managed_pages;
	unsigned long		spanned_pages;
	unsigned long		present_pages;
	const char		*name;
	int initialized;
	
    /* Write-intensive fields used from the page allocator */
	CACHELINE_PADDING(_pad1_);
    
	/* free areas of different sizes */
	struct free_area	free_area[MAX_ORDER + 1];

	/* zone flags, see below */
	unsigned long		flags;

	/* Primarily protects free_area */
	spinlock_t		lock;

	/* Write-intensive fields used by compaction and vmstats. */
	CACHELINE_PADDING(_pad2_);

	/*
	 * When free pages are below this point, additional steps are taken
	 * when reading the number of free pages to avoid per-cpu counter
	 * drift allowing watermarks to be breached
	 */
	unsigned long percpu_drift_mark;

	bool			contiguous;

	CACHELINE_PADDING(_pad3_);
	/* Zone statistics */
	atomic_long_t		vm_stat[NR_VM_ZONE_STAT_ITEMS];
	atomic_long_t		vm_numa_event[NR_VM_NUMA_EVENT_ITEMS];
} ____cacheline_internodealigned_in_smp;

```

# Memory under pressure
Each zone has two watermarks: high and low. when the number of free pages reaches the low watermark or lower, kswapd is awaken. kswapd is the kernel's mechanism to start swapping memory pages on disk. Notice: low mem is not swapable.
the current values of these watermarks can be seen via
```bash
cat /proc/zoneinfo
```



# Memory Management in linux

## Memory Layout
memory in OS is split into layers. biggest layer is called Node. Node is composed of zones, and zones is composed of areas.
check `lstopo` and `lstopo-no-graphics` to visualize this structure and the PCI buses as a bonus.


## BSA (Buddy System Allocation)
this is the buddy allocation algorithm that is used in kernel. on initialization, it pre-maps the whole memory in the RAM that is allocatable. the lowmemory region in the kernel memory space maps all the RAM memory. this is possible since we 
are talking about the virtual memory of the kernel space, which ideally would be much bigger than the actual memory (4GBs on 32bits & up to 2 ^ 64 / 2 << 60 eta bytes on 64bits "actually it is much less since only 48 bits are used for 
addressing"). 
this alogirhtm splits the memory into a list of sizes. these sizes are determined by an input called order. this is a kconfig that is passed to kernel on build time (CONFIG_ORDER). the algorithm pre allocates memory according to the order as 
mentioned. order is an integer number. the granular unit of memory the kernel uses is a page which is 4k. let's say the order is 11? the kernel allocates 11 different sizes of memory according to this rule:
2^i * 4 -> is the final size returned. where i belongs to [0-n[
this means the for n == 11 the kernel splits the memory into the following sizes:
* 2^0 * 4 = 4k -> when a process requests 4k one of the pages marked here is returned
* 2^1 * 4 = 8k -> when a process requests 8k one of the pages marked here is returned
* 2^2 * 4 = 16k -> // // // // 
* 2^3 * 4 = 32K -> // // // //
* 2^4 * 4 = 64K -> // // // //
* 2^5 * 4 = 128K -> // // // //
* 2^6 * 4 = 256k -> // // / //
* .
* .
* . 
* 2^10 * 4 = 4096k (4MB) -> the maximum memory that can be allocated on system with order 11.

Notice: the order config is arch dependent. 
if allocating more than 4MBs, then use the vm apis.

#### Special cases for BSA
* what if we are allocating something like 132KBs that is between 128k and 256k. how will BSA handle this?
-> it takes memory chunk of 256k (64 pages of 4kbs) size and returns it.
* What if there was no memory of size 256k available?
-> it takes one 512k memory splits it into two 256k pages. returns one for the caller, and adds
the other in the available 256k memory pool. this effectively handles external fragmentation issue.
but notice how bad internal fragmentation is. there is 256k - 132k = 124k memory wasted. this is solved by the get_exact_pages API. it minimizes internal fragmentation but does not eliminate it.
in this case of free the BSA is smart enough to know that this chunk was split from 512k memory, so it searches for the chunck's buddy (hence Buddy System Allocation) and combines them back in the 512k memory chuncks pool.

#### files to debug this
- /proc/buddyinfo:
<node><zone><zone-name><nof2^i*4> for i = 0 to 10 inclusive.
Node 0, zone      DMA      0      0      0      0      0      0      0      0      1      2      2 
Node 0, zone    DMA32   4195   4019   3707   2654   1570    770    284     73     17     15     11 
Node 0, zone   Normal   5714   2150    806    484    324    157     62     20      8      0      0 


# Slab
slab is a linux kernel memory management component that sits on top of Buddy System allocation (BSA).
upon initialization it requests memory from BSA and caches this memory and then the appropriate
APIs are used to request this memory. there are specific predefined structs that are cached.
kernel and/or driver developers can define their own custom structs and register them with slab.
they can allocate and free such memory and destory the cache when no longer needed. 
in case of memory pressure, the kernel knows how to shrink the slab cache.
linux kernel provides three implementations of slab:
- slab: old classic
- slub: unqueued slab, optimized
- ....: ....

allocated memory is physically contiguous and CPU cache line aligned. same for BSA




# must move to apropriate sections
- three memory types, DMA (for ISA devices), NORMAL (low mem region), HIGHMEM region
- ultimetly SLAB & BSA get memory from low mem region
- linux kernel memory is unswapable, can't be swapped to disk


# Algorithms used for memory (de)allocation
