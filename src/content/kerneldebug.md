# Overview
This document is completely my own. it shows me how I setup a workspace to debug the linux kernel. it also prints all information gathered from these debugging sessions.

# Setup - General
* you will need to compile the kernel with debug options
* you will need to setup two virtaul machines
* configure both virtual machines to communicate using 
  serial ports in host pipe mode witht the same file for 
  both machines
* copy the vmlinux outside the Target machine and place on
  Host machine
  
# Setup - Target
* compile the kernel with kgdb debug info enabled
* after installing the debug kernel, update the debug 
  machine boot command line and append `nokaslr kgdbwait 
  kgdboc=ttyS0,115200` this instructs kgdboc driver (the 
  driver responsible for gdb inside the kernel and the main 
  portal of kgdb in the kernel) to wait for connection on 
  serial port and construct the connection with 115200 bits
  per second. nokaslr, disables the kernel ASLR (a security
  feature that randomizes the kernel address space layout)

# Setup - Host
* TODO


# First calls
the kernel init sequence until the first kgdb break point
goes as the following:
func	file	addr	args
kgdb_breakpoint	kernel/debug/debug_core.c:1219
	0xffffffff8118d000	
kgdb_initial_breakpoint	kernel/debug/debug_core.c:1020
	0xffffffff81969800	
kgdb_register_io_module	kernel/debug/debug_core.c:1157
	0xffffffff81969800	
configure_kgdboc	drivers/tty/serial/kgdboc.c:209
	0xffffffff8166b800	
kgdboc_probe	drivers/tty/serial/kgdboc.c:236
	0xffffffff8166b800	
platform_probe	drivers/base/platform.c:1400
	0xffffffff816a5000	
call_driver_probe	drivers/base/dd.c:560
	0xffffffff816a2000	
really_probe	drivers/base/dd.c:639
	0xffffffff816a2000	
__driver_probe_device	drivers/base/dd.c:783
	0xffffffff816a2800	
driver_probe_device	drivers/base/dd.c:813
	0xffffffff816a2800	
__device_attach_driver	drivers/base/dd.c:941
	0xffffffff816a3000	
bus_for_each_drv	drivers/base/bus.c:427
	0xffffffff816a0000	
__device_attach	drivers/base/dd.c:1013
	0xffffffff816a2800	
device_initial_probe	drivers/base/dd.c:1062
	0xffffffff816a3000	
bus_probe_device	drivers/base/bus.c:487
	0xffffffff816a1000	
device_add	drivers/base/core.c:3664
	0xffffffff8169e800	
platform_device_add	drivers/base/platform.c:717
	0xffffffff816a5000	
init_kgdboc	drivers/tty/serial/kgdboc.c:279
	0xffffffff824bd000	
do_one_initcall	init/main.c:1303
	0xffffffff81001000	
do_initcall_level	init/main.c:1376
	0xffffffff8246b800	
do_initcalls	init/main.c:1392
	0xffffffff8246b800	
do_basic_setup	init/main.c:1411
	0xffffffff8246b800	
kernel_init_freeable	init/main.c:1631
	0xffffffff8246b800	
kernel_init	init/main.c:1519
	0xffffffff819a6800	
ret_from_fork	arch/x86/entry/entry_64.S:306

Notice how all the kernel addresses start with 0xffffffff <- kernel virtual address space.
as you can see, the first parts before kgdb_initial_breakpoint can't be debugged. this is by design for kgdb. 
kgdb allows users to tap into a specific function they are looking to debug. it's not as flexible as userland programs debugging.

this stack is running in three threads

# Understanding kernel_init
* linux code defines a completion structure. a completion structure is kind of like a mutex used to mark specific tasks as completed. it has a queue where the threads
responsible for completing the work are queued.
* kthreadd is the daemon process that enumerates all kthread threads. this is the first op that happens in kernel_init
* __ref is a post compile check using the section feature of gcc. section feature allows adding code in a section other than .text sectionl. kernel adds the init code 
  in a separate .init section which is discarded after the init process is done. the __ref section makes sure there are no references after compliation to that init 
  section, otherwise it is a bug
* for every arch there is a main.c that contains start_kernel or main routine that is the entry point from grub. this sets up the low level stuff, like detecting memory layout,
  and jumping to protected mode in x86.
* kernel_init_freeable:


# Kernel events and ftrace
## kernel tracepoints
- tracepoints are points in code that provides hooks that allows certain methods to be attached to.
- a tracepoint can be on (when method attached to it) or off (nothing attached to it - entails minor time and space penalty)
- when a function is called, tracepoint is executed and hooks are executed, then call returns and function call proceeds
- this is useful for developing kernel subsystem modules or kernel modules in general

## kernel events
- events are an application of tracepoints.
- to enable events (/sys/kernel/tracing/set_event) or the eventsfs directories where every directory matches a subsystem
  with directories inside matchine every event. echo 1 in enable file to enable the event.
- you can enable the events in the boot options. trace_event=[event-list]
- Events can be filtered in filters file (filters have syntax that can be read in documentation)
- 


