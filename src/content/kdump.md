# overview
in this document I am documenting kdump usages.
there are two kernels we talk about: a crash kernel, and a production kernel. 
Kdump is composed of two components: kdump and kexec.
kexec is a fast booting mechanism to boot a linux kernel from an already running linux kernel.
the running production kernel preserves a section in memory that the crash kernel uses to boot from.
kdump is a new crash dumping mechanism. crash is captured from the context of a freshly booted
kernel and not the crashing kernel. crash kernel boots with very little memory and captures the 
dump image.

# requirements
- production kernel is configured correctly for kdump.
- production kernel has the kernel-kdump package installed.
- kernel-kdump package must be the same on both the standard and the crash kernel.

# required configs (Note to self: I think these configs are for the kdump kernel not the prod one)
- `CONFIG_KEXEC=y` -> sysk
- `CONFIG_KEXEC_CORE=y` -> sysk
- `CONFIG_CRASH_DUMP=y` -> kdumpk
- `CONFIG_HIGHMEM4G=y` this may not be applicable if system has < 4GBs ram or is 64 bit sys. -> kdumpk
- `CONFIG_SMP=n` this is optional, but we have to remember this in kdump configs. kdump works best,
  with single processor. in `/etc/sysconfig/kdump` we need to add this config:
  ```bash
  KDUMP_COMMANDLINE_APPEND="maxcpus=1 "
  ```
  -> kdumpk
- `CONFIG_SYSFS=y` -> sysk
- `CONFIG_PROC_VMCORE=y` -> kdumpk
- `CONFIG_DEBUG_INFO=y` -> sysk
- need to configure `CONFIG_PHYSICAL_START` with a value. this value will be the memory in ram
  that is reserved for the crash kernel.
- `CONFIG_LOCALVERSION='-kdump'` this is to mark the kernel as kdump. -> kdumpk
- `CONFIG_RELOCATEABLE=y` -> kdump
crash kernel can't be compressed if it is not relocatable

# sysk
the system kernel needs to be booted with specific command line options to enable this 
functionality to load the second kernel upon a crash.
`crashkernel=Y@X` where X is start of memory region reserved for dump-capture kernel.
generally X is 16MB so we can set `CONFIG_PHYSICAL_START=0x1000000`
Y is size.
if X is zero or omitted then crash kernel will be placed at runtime by the system kernel.

# arm64
use a relocatable kernel, Enable "AUTO_ZRELADDR" support under "Boot" options:
`AUTO_ZRELADDR=y`

next step is to load the crash kernel in memory so that when a panic is triggered the kernel is booted

```bash
kexec -p <dump-capture-kernel-vmlinux-image> \
--initrd=<initrd-for-dump-capture-kernel> --args-linux \
--append="root=<root-dev> <arch-specific-options>"
```



kexec command:
kexec -p vmlinuz-6.5.0-rc2-kdump --initrd initrd.img-6.5.0-rc2-kdump --args-linux --append="root=/ 1 irqpoll nr_cpus=1 reset_devices"
