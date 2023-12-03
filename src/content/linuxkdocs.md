# The linux kernel docs
- LTTng is a powerful tracing toolkit. you can search for it lttng.org/docs in order to install. this also has a nice GUI tool called tracecompass that interprets the output of the trace utilities.
- there are a bunch of static analyzers for the kernel specifically. the most important and good one is sparse
- Procmap visualize the complete Kernel Virtual Address Space
- ctags and cscope kernel browsing tools. need to get familiar with them
- there are three ways to get a starting config for building the kernel:
  - use configs from /boot/$(uname -r)
  - use configs from $LINUX_ROOT/arch/<processor-arch/configs
  - use a file containing loaded mods exported and executing localmodconfig target
  ```Bash
  lsmod > /tmp/lsmod.now # any file name
  make LSMOD=/tmp/lsmod.now localmodconfig
  ```

- linux kernel coding style [style](https://www.kernel.org/doc/html/latest/process/coding-style.html)
- Kconfig [syntax](https://www.kernel.org/doc/Documentation/kbuild/kconfig-language.txt)
- Why initramfs?
Imagine for a moment that you are in the business of building and maintaining a new Linux distribution. Now, at installation time, the end user of your distribution might decide to format their SCSI disk with the reiserfs filesystem (FYI, 
it's the earliest general-purpose journaled filesystem in the kernel). The thing is, you cannot know in advance what choice exactly the end user will make – it could be one of any number of filesystems. So, you decide to pre-build and supply 
a large variety of kernel modules that will fulfill almost every possibility. Fine, when the installation is complete and the user's system boots up, the kernel will, in this scenario, require the reiserfs.ko kernel module in order to 
successfully mount the root filesystem and thus proceed with system boot-up.
but wait, think about this, we now have a classic chicken-and-egg problem: in order for the kernel to mount the root filesystem, it requires the reiserfs.ko kernel module file to be loaded into RAM (as it contains the necessary code to be 
able to work with the filesystem). But, that file is itself embedded inside the reiserfs root filesystem; to be precise, within the /lib/modules/<kernel-ver>/kernel/fs/reiserfs/ directory! One of the primary purposes of the initramfs 
framework is to solve this chicken-and-egg problem.
initramfs contains basic structure of rootfs and has all modules (*.ko) files. cpio file is a flat file format used by tar

- Whas is initrd?
serving the same purpoise ans initramfs, initrd is a cpio archive that is multilevel. i.e, it has to be extracted on multiple times to get the actual file system underneath. the first level contains a Microcode that is the firmware code for 
the process. the next levels contains
the actual file system.

- What is the difference between initramfs and initrd?
initramfs is more modern and more flexible than initrd. supports wider compression algorithms. can be mounted directly as a permenant rootfs and the kernel chooses to pivot later. smaller in size.

- Big distributions like Ubuntu, insert a huge array of modules in the linux kernel because they don't know before hand which Hardware will be used to run the linux kernel.

- the only packages required to build the linux kernel through debian are:
  flex bison libssl-dev libelf-dev
  given that the build chain is installed ofc.
  

# Controlling the log level of printk
- the /proc/sys/kernel/printk shows 4 numbers
```bash
$ echo /proc/sys/kernel/printk
4 4 1 7
```
<current> <default level> <minimum allowed level> <boot time default>

However to enable pr_debug &| pr_devel output in dmesg you need to compile the module with extra cflags.
```make
CFLAGS_printk_loglvl.o := -DDEBUG
```

to print all the messages of printk regardless of the level (ignore_level)
the kernel needs to boot with a cmd line `ignore_level`

or at runtime: sudo bash -c "echo Y > /sys/module/printk/parameters/ignore_loglevel"

or through dmesg see --console-level option

# About the Kernel
- Major subsystems:
     core kernel - (user and kernel) process and thread creation/destruction,
	           CPU, scheduling, synchronization primitives, signaling,
		   timers, interrupt handling, namespaces, cgroups, module
		   support, crypto, etc
     memory management
     VFS (filesystem support)
     block IO
     network protocol stack
     IPC (Inter Process Communication) support
     sound (audio) support
     virtualization support
    
- the kernel module has access to only a subset of all kernel APIs and data structures (more on this in the next chapter!)

- the path /lib/modules/$(uname -r)/build is a symlink to a subset of the linux tree. it contains many of the utilities required by modules to build for example. notice in case of building the linux kernel from scratch you get the root 
  folder of the linux kernel symlinked to the root of the linux kernel source tree where the source would originally exist (/usr/lib/modules/...).

- loading and removing modules has a support in the kernel Capabilities model. man page on capabilities(7) for details.

# Kernel Directory Structure
At the very top level of the source tree /usr/src/linux you will see a number of directories:
- arch
  The arch subdirectory contains all of the architecture specific kernel code. It has further subdirectories, one per supported architecture, for example i386 and alpha.
- include
  The include subdirectory contains most of the include files needed to build the kernel code. It too has further subdirectories including one for every architecture supported. The include/asm subdirectory is a soft link to the real include directory needed for this      
  architecture, for example include/asm-i386. To change architectures you need to edit the kernel makefile and rerun the Linux kernel configuration program.
- init
  This directory contains the initialization code for the kernel and it is a very good place to start looking at how the kernel works.
- mm
  This directory contains all of the memory management code. The architecture specific memory management code lives down in arch/*/mm/, for example arch/i386/mm/fault.c.
- drivers
  All of the system's device drivers live in this directory. They are further sub-divided into classes of device driver, for example block.
- ipc
  This directory contains the kernels inter-process communications code.
- modules
  This is simply a directory used to hold built modules.
- fs
  All of the file system code. This is further sub-divided into directories, one per supported file system, for example vfat and ext2.
- kernel
  The main kernel code. Again, the architecture specific kernel code is in arch/*/kernel.
- net
  The kernel's networking code.
- lib
  This directory contains the kernel's library code. The architecture specific library code can be found in arch/*/lib/.
- scripts
  This directory contains the scripts (for example awk and tk scripts) that are used when the kernel is configured.


# Kernel scheduler
- the granular unit of scheduling in linux is a thread
- each thread has a corresponding task struct
- Linux implements the posix defined set of algorimths plus some more algorithms
- the posix defined algorithms are:
  -  CFS (completely fair schedular) SCHED_NORMAL/SCHED_OTHER
     -  this uses a set of proiority values called niceness between -20 and 19.
     -  the lower the number the higher the priority.
     -  sutiable for day to day jobs and servers
     -  non real time threads can't have a priority of zero in order to make sure that they don't compete with real time threads
  - Real time SCHED_RR
    - soft real time scheduling policies
    - priority ranges from 1 to 99. the lower the number the lesser the prioirty
    - thread yields the process if it blocks on i/o, stops or dies, or a higher priority task becomes runnable
    - this works with time slices. i.e a task running will get a certain time slice before the algorithm re-evalutes
      which task to run
  - FIFO SCHED_FIFO
    - soft real time policy as well but more aggressive than RR
    - priority values the same as RR
    - conditions for premetion is the same except for the time slice part. there are no time slices in this algorithm.
      i.e a task running will not yield the proccessor until the conditions happen.
  - SCHED_BATCH
    - suitable for non interactive batch jobs
    - priority same as nice values
  - SCHED_IDLE
    - this is a special case used only for task 0.
    - task 0 is the idle task. if a processor has no tasks to run it runs this task.
    - this task is called swapper
- Software and Hardware interrupts are superior to any scheduling algorithm and don't follow scheduling rules.
- the task_struct belongs to a class of scheduling algorithm. think of this like an abstract class and the algorithms are 
  implementations of this class.
- scheduling policies and priorities (nice and priority) are members of task struct
- Linux implements more algorithms that are superior to FIFO/RR like stop-schedule and deadline

## Shed class
* linux scheduling class is implemented as a modular OOP class
* there are 5 main classes (stop-sched, dl, rt, fair, idle)
* every thread is associated with a task struct
* in every task struct there is an attribute that describes the type
* a thread can only belong to one sched class at a time
* task struct also has pointer to the sched class
* SCHED_FIFO, RR -> RT
* SCHED_ORTHER, NORMAL -> CFS
* swapper, idle -> idle
* Linux implements a runqueue per processor per scheduling class. 8 cpus => 40 rqs
* runqueues: Contains the tasks that are ready to run
* runqueues implementations differ per class, CFS = RBTrees, RT => Array Of linked lists 
* priority of schedules: SS, DL, RT, CFS, idle

## CFS
* The scheduler keeps track of the cpu runtime for each thread (sched_entity: contains vruntime: monotonic counter keeps track of amount of time
  in nanoseconds accumlated as runtime for thread)
* The thread that has the least runtime will be the next one for scheduling to run
* runqueue for CFS is an rb-tree with vruntime as key: makes scanning the tree from left to right = timeline for tasks for processor

## Visualizing the flow
We use perf to visualize the processor core timeline.

# Kernel Api Documentation?
in this section I will try to document the internal kernel APIs for myself. 
- get_free_page: requests a free page through BSA (not sure of the name)
- get_pages: requests multiple pages from kernel through BSA(not sure of the name)
- get_exact_pages: requests the exact number of pages, treating the issue of internal fragmentation
  that happens from get_free_page/pages
- free_page(s), free_exact_pages: frees the requested pages.
- kmalloc: allocate memory through slab.
- kzalloc: allocate memory through slab but initializes the allocated memory to zeros.
- kfree: frees the allocated memory back to the slab caches
- ksize: prints the actual size of the allocated memory
- register_shrinker: registers a custom slab shrinker for custom slab allocated cache.
- struct shrinker{
  int count_objects: returns number of slab objects that can be freed
  int scan_objects: if count_objects returns non-zero, this method is called to shrink the slab cache.
}
- vmalloc: allocate virtual memory of size given
- vzalloc: allocate virtual memory zerod out
- vfree: free the allocated virtual memory
- kvmalloc: attempts to create memory using kalloc if failed fall back to vmalloc.
- kvfree: free memory allocated with ^
- kvzalloc: same as kvmalloc but zeros out the allocated memory
- kvmalloc_array: allocates n elements of size bytes
- kvcalloc: same as calloc in user space
- kvmaloc_node & kzalloc_node: allocates memory in a specific memory node.
- vmalloc_exec: allocate executable virtual memory (not exported)
- vmalloc_user: allocate virtual memory suitable for mapping in user space.
- __vmalloc: same as vmalloc but allows specifying memory permissions.
- checkout __alloc_pages_nodemask: the funnel through which all memory allocation goes through
- kmem_cache_create: create a slab cache
- kmem_cache_destroy: destroy a slab cache
- kmem_cache_alloc: allocates an object from slab
- kmem_cache_free: frees an object from slab
- devm_kmalloc, devm_kzalloc: allocates memory from slab with promise it will be freed.


# Kernel VM
Kernal has the ability also to work with kernel memory for kernel objects. there is a virtual
memory region in the kernel bounded by VMALLOC_START and VMALLOC_END-1. when working with virtual
memory, only when the memory is read/written the physical memory is allocated. this is called
lazy allocation or demand pagine or on demand allocation.
memory allocated is guaranteed to be virtually contiguousbut not physically contiguous.
Notes:
- must only be invoked from process context
- benificial in allocations for buffers and cache 
- Physical memory is allocated via page fault handler
- Page aligned

#### debug this
- /proc/vmallocinfo

# OOM
- Linux has a feature named magic SysRq: allows execution of system commands (syscalls) with
magic key presses. by default it is disabled. to enable checkout /proc/sys/kernel/sysrq
- Linux by default allows overcommitting memory. i.e, virtual memory becomes more than the
available actual memory. (read opened tabs to understand more)
/proc/sys/vm/overcommit_*
- 0: (memory+swap)(ovcommit + 100)%
- 1: (memory+swap)(overcommit/100)
- 2: disabled
- if memory can't be allocated or virtual memory exceeds the overcommit ratio then oom is triggered.
- oom_score: how much percentage of the memory allocated to the process is used. 
  (lowest: 0, highest: 1000) highest process wins an oom kill. 
  /proc/<pid>/oom_score.
  score is: current score + adj
  /proc/<pid>/oom_adj

# Cross compilation
- A module that is compiled for kernel vx.y.z can not run on kernel vx1.y.z or any other 
  kernel for that matter, same goes for different hardware.
  To achieve this the following must be done:
  - use the kernel src tree for the target kernel version
  - use the tool chain for the architecture (machine instructions) for target machine


# Ideal kernel module make file
- The "usual" ones – the build, install, and clean targets.
- Kernel coding style generation and checking (via indent(1) and the kernel's checkpatch.pl script, respectively).
- Kernel static analysis targets (sparse, gcc, and flawfinder), with a mention of Coccinelle.
- A couple of "dummy" kernel dynamic analysis targets (KASAN and LOCKDEP / CONFIG_PROVE_LOCKING), encouraging you to    
  configure, build, and use a "debug" kernel for all your test cases.
- A simple tarxz-pkg target that tars and compresses the source files into the preceding directory. This enables you to 
  transfer the compressed tar-xz file to any other Linux system, and extract and build the LKM there.
- A "dummy" dynamic analysis target, pointing out how you should invest time in configuring 
  and building a "debug" kernel and using it to catch bugs! (More on this follows shortly.)

# linux kernel modules
- TODO: write the rest of the info.
- TODO: create a template for your self
- TODO: find a module idea to implement (emulating a serial console)
- A module can be auto loaded via:
  - telling systemd about it /etc/modules.d/modules.conf
  - create a file.conf for it under /etc/modules-load.d/<mod-name>.conf with the module
    name inside
- if Module expects paramters this can be done in two ways:
  - via a modprobe file under /etc/modprobe.d/<mod-name>.conf
  ```conf
  options <module-name> <parameter-name>=<value>
  ```
  - if it's baked right into the kernel then it via the kernel command

# process VAS
Higher address ->  -------------------------------   <- program break
                   |      <stack>                |
                   |                             |
                   |-----------------------------|
                   |<thread1stack>|<thread2stack>|
                   |-----------------------------|
                   |                             |
                   |<libraries linked text+code> |
                   |                             |
                   |                             |
                   |-----------------------------|
                   |<heap>                       |
                   |                             |
                   |                             |
                   |-----------------------------|
                   |<uninitialized data>         |
                   |-----------------------------|
                   |<initialized data>           |
                   |-----------------------------|
                   |<text (code)>                |
                   -------------------------------
- kernel has no notion of process. they are called threads. each thread is an execution path.
- every thread has a stack per privilige run (i.e, a user space thread has two stacks:
  one for user space, one for kernel space)
- to view kernel stack /proc/$$/stack
- syscall foo becomes sys_foo as a method in kernel, then sys_foo calls do_foo. 
  SYSCALL_DEFINE(n)(foo, ....) expans to sys_foo with (n) being the number of params passed
  to syscall [0, 6]
- ebpf (bfp for short) is the way to go for system app tracing and performance analysis on
  linux.
- 
# Important readings
- this is probably the most important and interesting read of all which is at:
  [kernel docs](https://docs.kernel.org/)
- kbuild.rst in kern docs
- [kprintf formats](https://www.kernel.org/doc/html/latest/core-api/printk-formats.html#how-to-get-printk-format-specifiers-right) (can make the code more portable and more secure)
- https://www.kernel.org/doc/html/latest/admin-guide/kernel-parameters.html
- [why hardware params have their own module params macro](https://lwn.net/Articles/708274/)
- evidently the KernelPR bot on github explains how to send an email patch to be included
  in the linux kernel. check [here](https://github.com/torvalds/linux/pull/805)
- [module signing](https://www.kernel.org/doc/html/latest/admin-guide/module-signing.html)
- [coding guidelines](https://www.kernel.org/doc/html/latest/process/coding-style.html)
- [how to do linux kernel development](https://www.kernel.org/doc/html/latest/process/howto.html#howto-do-linux-kernel-development)

# Important for notes (debugging, style, etc.)
- debugging with dmesg in a clean output way (less corrupts the colors)
```bash
$ dmesg --decode --nopager --ctime # shows log level and human readable messages
```

- providing access flags as numbers is not favorable. use `include/uapi/linux/stat.h`
  to get stuff like S_IRUSR and the rest of the familly (remember POSIX?)
  anyways :D kernel community disagress checkpatch.pl raises a warning.


# TODO @ Work
- have security (spire & stuff) as modules rather than in the init process?
  - not really needed? why would we do that?
- have canaries run a debug kernel version
  - the kernel is compiled with enougn debug info. unless you prove there is a need for 
    more debug options to be enabled this has no meaning
- validate the production kernel config for security. use the python tool mentioned
  - security validation happens by security team.
- validate kernel module settings:
  - do we use customizable modules? No? turn of loading modules..
  - yes? validate modules are forceibly signed before loaded..
  - can we load a non signed module? yes? sound the alarm, reconfig and deploy
  - No? phew we are slightly secure.


# TODO @ Fun
- buy a NUC
- buy a rasperrybi :cat-smile: (Yocto project, rasperrybi docs)

# Fun questions to look for
- where does the init execution happen? when does it happen?

# Further readings
- smem, pmap, sproc (in procfs)
