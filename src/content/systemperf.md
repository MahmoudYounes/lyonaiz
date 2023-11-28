# Overview
discussing system performance and documenting my learnings in this topic.

- Havine a diagram showing interaction of the components of the system is crucial for this job.
- Understanding the purpose of performance analysis is crucial and which component the team is responsible for to analyis.
Notice that we are talking about system performance not a specific component. this means that application performance, database performance, 
Network performance, OS performance, and Hardware performance are included in this analysis. Ideally, database team would be responsible for
database performance, Networking team would be respondible for Network performance, etc. In some companies there would be a team responsible for
System performance on all layers like in Netflix.

# Chapter 1
## Activities of system performance.
- setting goals for the performance and performance modeling. (is this SLO?)
- Performance characterization for prototypes for software and hardware.
- Performance analysis of in-development products in a test environment
- Non regression testing: testing that makes sure that the system performance does not regress after the changes.
- Benchmarking the product
Blue-green deployments (deploying the new software in production while leaving the old one running and gradually shifting the traffic to the new 
one with the old one serving as backup allowing for rollbacks in this case) or canary deployments are used to replace all of these steps.
Note: Netflix uses red black deployments which is the same as blue green but netflix wants to sound cool.
Note: the above steps are done in development phase and sometimes they are skipped in favor of time to market and handled by the deployment
strategies mentioned above.
- perf monitoring in prod
- perf test in prod
- perf analysis in prod
- perf tunning in prod
- incident reviews
- perf tools development for prod analysis and tunning accordingly

there are two prespectives to analysis of a system. Workload analysis and resource analysis.
Workload analysis is starting the analysis from the point of view of the workload, for example, tracing the workload methods and what they called
and how much time is spent in each call. this also includes tracing the time taken for external systems functions.
Resource analysis is starting from monitoring the performance of the resource given a specific request from the workload. example, monitoring the
os performance internally for a specific resource used by workload.
its helpfull to have both prespectives.

## Latency
One of the most important metrics to use, and can be used for management to justify funding a specific improvement plan. Latency means the time
spent waiting for an operation to complete. there are different types of latencies like network latency or io latency. 

## Observibility
Understanding the system performance through observation. this is different from benchmarking the system.
Observability tools should be the first thing to try in production system. For test environment Benchmarking tools are the best.
Counters, metrics, profiling and tracing are the tools for observability.
the product of observability is a set of counters that are used to derive metrics and metrics are probably visualized as time series for the most
cases. A time series graph is probably enough to point you in a certain direction. it could be enough to tell you where is the problem. if
it does not point directly to the problem but rather points you somewhere this is where the proofling tools come into play as handy tools to 
pin point the problem.

## Profiling
taking a sampled subset of measurements during excution time.
flamegraphs are the most common way to visualize this.

## Tracing
Tracing is event based recording. strace, tcpdump, ftrace and bpf-trace.
static instrumentation is specific instrumentation points added to the software to instrument it. in linux it is called trace points.
static user defined tracing is a library used by libc for instrumenting library calls.
ex: execsnoop a linux utility that prints new processes created while it is tracing/instrumenting execve system call. this is useful to reveal
short lived processes while a command is executed.

dynamic tracing creates tracing points after the software is ran, by modifying the in memory instruction to add instrumentation routine.
this is the concept of breakpoints. this is kprobes in the linux kernel. there is also Dtrace and BPF

## Experimentation tools or Benchmarking
these apply workload and can cause issues in production

## Example tools
iperf which is used to measure network performance.

## Perf analysis checklist
* uptime: for load average
* dmesg -T | tail: kernel errors and events including OOM kills
* vmstat -SM 1: System wide statistics: run queue length, swapping, overall CPU usage
* mpstat -P ALL 1: Per CPU balance a single busy CPU can indicate poor thread scaling
* pidstat 1: per process cpu usage identify unexpected CPU consumers and user/system cpu time for each process
* iostat -sxz 1: disk io statistics iops and throughput average wait time percent busy
* free -m: memory usage including fs cache
* sar -n DEV 1: network device io: packets and throughput
* sar -n TCP,ETCP 1: tcp statistics: connection rates, retransmits.
* top: check overview.
* cachestat: check the fs page cache misses hits rate.

# Chapter 2: methodoligies
## Overview
reading the man pages will not help you figure out what is wrong. however, it is the mental process, the know how, the methodology.

One important keyword here that needs to be defined is workload characterization, which basically mean describing the workload. i.e 
what is the average number of requests per second. what is the deviation. all of this is driven from real world usecases. i.e, from
the actual production workload.

## Terminology
* IOPS: input output operations per second
* throughput: the rate of work performed. ex in database this can refer to the number of operations performed per second.
* Response time: the time for operation to complete. includes all time. service time, time waiting, time to be serviced.
* Latency: a measure of the time spent for operation waiting to be serviced. in some contexts it can be the same as response time.
* Utilization: How much time a resource was busy servicing an operation. for storage it refers to the current capacity of the resource.
* Saturation: the degree to which a resource has queued work it can't service.
* Bottleneck: a resource that limits the perofrmance of the system.
* Workload: the load that is the input to the system.
* Cache: a storage area that is not persistent and is faster than the original storage area.

* Perturbations means interferance and can cause the test of the system to be inaccurate.

## tradeoffs
Good fast cheap: you will achieve two but not the third.
High-performance on-time inexpensive: same as above.

fx:
tunnable parameters like filesystem record size and network buffer size:
* file system record size: small record size close to the application io size will allow the application to perform better for random
io, and make more efficient use of io cache. while large size will improve streaming workloads including file system backups.
* Network buffer size: small size will reduce memory overhead and allow the system to scale. bigger size will increase throughput.

the closer the tunnable to the application level the more the gain is.

## When to stop
this depends on the comapny's requirements and the ROI expected.
as a general rule: when the performance cost is more than the ROI or there is a greater win in some other issue.

tunnable recommendations are available for the point in time they were recommended in. they might not be available for a different workload.
or for the same workload in a different point in time.

## Scalability
assuming a linear load increae. the response time will increase linearly as well untill a certain point is reached where resources are saturated.
the response time will stablize for a while while the load is increasing, until the overhead of queueing and scheduling resources to process the
requests increase, in which case the response time will start gradually and slowly/or rapidly decreasing.

## Metrics
Observer effect is the time taken by the metrics gathering and emission which impacts the observed entity.

## Utilization
the usage of a resource.

### time based utlization 
is described in queuing theory as U=B/T 
U is utlization
B total time the system was busy during T
T the observation period
iostat calls this %b this is also the outcome of observation tools on most systems.
resource x is utilizaed x% of the time. the average amount of time the server or resource
was busy.

### capacity based utilization
means how much a resource capacity is taken. in case of disks, a disk at 100% capacity can't accept any more work

### Saturation
saturation happens when 100% capacity based utilization is reached. it's the degree to which more work is requested of a resource
than it can process. saturation causes performance issues as it increases latency. for time based utilization saturation may not occur
at the 100% mark depending on the degree the resource can operate in parallel.

### Profiling
builds a sampled picture of the system that can be studied later.
this picture is more coarse (hard, rough, vulgar) than the picture provided by metrics.

### Caching
a faster tier of storage that is used to store data in a slower tier of storage but more persistent.
caches play an important role in optimizing the performance.

miss ratio: misses/(misses + hits) can provide an indication but not very descriptive.
miss rate: misses / unit time (secomd)
total latency: miss rate * miss latency + hit rate * hit latency
^ helps understand cache performance

caching algorithms: MRU, LRU, MFU, LFU, NFU <- nice reading exercise.
cache types: hot (most frequent requests are already there providing higher hit rate), cold (start with empty cache), warm (start with populated 
cache)

### known-unknowns
- known-knowns: ex: performance metric and it's current value. ex: CPU Utilization should
  be 10%.
- known-unknowns: ex: checking for the existence of a subsystem using profiling tool fx.
- unknown-unknowns: ex: device interrupts becoming heavy CPU consumers.

### Perspectives
Workload analysis (top-bottom) vs resource analysis (bottom-up).
Workload analysis, analysis starts at the workload and can advance all the way down to the
OS stack. (most used analysis)
Resource analysis, analysis starts at the OS level and goes all the way up until the 
workload.

#### Strategies for Resource analysis
- performance issues investigation: to see if a particular type of resource is responsbile
  for an issue. (CPU, memory, disks, network interfaces, buses, and interconnects)
- Capacity Planning: helps sizing the new systems, and see when resources will be exhausted.
focus is on utilization. some resources have utilization metrics readily available like CPU.
others, can be deduced from other metrics. network utilization fx. compare bytes recieved vs
bytes sent (throughput) with expected numbers.
- uses: IOPS, throughput, Utilization, Saturation, latency (how well the resource is 
  responding), os stat tools: vmstat, iostat, mpstat.

#### Strategies for workload analysis
How application performs.
targets: requests, latency, completion (errors vs success)
- workload characterization: studying the attributes of the workload. ex: database?
  query string, database name, client host, tables, etc.
  helps identify unnecessary work and unbalanced work.
- metrics: latency (most important) in this context latency=response time
  latency beyond threshold? an issue. identify root cause and fix.
  and throughput

## Methodology
Challenge when facing a performance issue: how to begin the analysis and how to proceed.

### Analysis patterns

#### Streetlight (Anti-Method)
absence of a delibrate methodology. use tools at random to brute force the issue source.
same for tuning.
pros: quick, analysis done by familiar tools
cons: brute force, not quick, may miss issues or gives wrong issues
Not Recommened.

#### Random Change (Anti-Method)
guess where the problem. do change and observe the metric showing the issue.
pros: quick, familiarity
cons: make tunnables that does make sense on long term, regression

#### Blame someone else (Anti-Method)
hypothsize that a component you are not responsible for is causing the issue, when proven
wrong, redirect to another team.
pros: None
cons: Everything

#### Ad hoc checklist
stepping through a predefined checklist.
ex: iostat -x 1 on a server that just got deployed.
pros: highest value for short frames 
cons: point in time recommendations that needs to be refreshed. focuses on common issues.

#### Problem Statement
What makes you think there is a performance problem? (first making sure there is a problem)
Has this system ever performed well? (asking about history)
What changed recently? Software? Hardware? Load? (asking about history)
Can the problem be expressed in terms of latency or runtime? (actual gauges)
Does the problem affect other people or applications (or is it just you)? (scope)
What is the environment? What software and hardware are used? Versions? Configuration? 
(analysis)
pros: quick
cons: not deep analysis, may require further work
recommended as a first step or as response to helping other folks

#### Scientific Method
1. Question (Problem statement)
2. Hypothesis (derived from 1)
3. Prediction (expected result)
4. Test (getting actual results)
5. Analysis (test expected vs actual and why?)

pros: methodical
cons: multiple hypothesis may be used before arriving to the final conclusion

#### Diagnosis Cycle
same as Scientific method, except that the next hypothesis is drived from data collected
form current hypothesis.
pros: methodical
cons: time

#### Tools Method
list all available tool and the ones that can be purchased. for each tool, list all useful
metrics, for each metric list ways to interpret it. similar to street light
pros: identify bottle necks, errors and other problems
cons: incomplete view of the system, knowledge required, ^not efficient, time consuming.

#### The USE Method
stands for Utilization, Saturation, and Errors.
should come early.
focuses on system resources.
for every resource check USE

pros: directs answers to specific metrics and limits the checks to be made as they are
made on the system resourcetypes.
cons: to be figured out with practice
procedure: https://learning.oreilly.com/api/v2/epubs/urn:orm:book:9780136821694/files/graphics/02fig12.jpg
notice the phantom effect in this method when you are collecting metrics.
a burst of high utilization can cause saturation and performance issues.
ex: CPU utilization can vary from second to second, a 5 minute average may hide 100%
utilization periods and therefore saturation.
generic list of system resources:

* CPUs: Sockets, cores, hardware threads (virtual CPUs)
* Main memory: DRAM
* Network interfaces: Ethernet ports, Infiniband
* Storage devices: Disks, storage adapters
* Accelerators: GPUs, TPUs, FPGAs, etc., if in use
* Controllers: Storage, network
* Interconnects: CPU, memory, I/O

Resource:Type:Metric
CPU:Utilization:CPU utilization (either per CPU or a system-wide average)
CPU:Saturation:Run queue length, scheduler latency, CPU pressure (Linux PSI)
Memory:Utilization:Available free memory (system-wide)
Memory:Saturation:Swapping (anonymous paging), page scanning, out-of-memory events, memory 
                  pressure (Linux PSI)
Network interface:Utilization:Receive throughput/max bandwidth, transmit throughput/max 
                  bandwidth
Storage device I/O:Utilization:Device busy percent
Storage device I/O:Saturation:Wait queue length, I/O pressure (Linux PSI)
Storage device I/O:Errors:Device errors (“soft,” “hard”)

CPU:Errors:For example, machine check exceptions, CPU cache errors5
Memory:Errors:For example, failed malloc()s (although a default Linux kernel configuration 
              makes this rare due to overcommit)
Network:Saturation:Saturation-related network interface or OS errors, e.g., Linux “overruns”
Storage controller:Utilization:Depends on the controller; it may have a maximum IOPS or 
                  throughput that can be checked against current activity
CPU interconnect:Utilization:Per-port throughput/maximum bandwidth (CPU performance 
                             counters)
Memory interconnect:Saturation:Memory stall cycles, high cycles per instruction (CPU 
                    performance counters)
I/O interconnect:Utilization:Bus throughput/maximum bandwidth (performance counters may 
                            exist on your HW, e.g., Intel “uncore” events)

Utilization: Utilization at 100% is usually a sign of a bottleneck (check saturation and its effect to confirm). Utilization beyond 60% can be a problem for a couple of reasons: depending on the interval, it can hide short bursts of 100% utilization. Also, some resources such as hard disks (but not CPUs) usually cannot be interrupted during an operation, even for higher-priority work. As utilization increases, queueing delays become more frequent and noticeable. See Section 2.6.5, Queueing Theory, for more about 60% utilization.

Saturation: Any degree of saturation (non-zero) can be a problem. It may be measured as the length of a wait queue, or as time spent waiting on the queue.

Errors: Non-zero error counters are worth investigating, especially if they are increasing while performance is poor.

#### The RED Method
Stands for Requests Errors & Duration

suitable for microservices. monitor the following three metrics:
RPS: number of requests per second
Erros: number of errors per second
Duration: duration of the requests. distribution?

#### Workload characterization
focuses on the input to the system. this includes the user load in the picture as the issue
may be caused by the load rather than the architecture.
answering the following questions should characterize the load correctly.
* Who is causing the load? Process ID, user ID, remote IP address?
* Why is the load being called? Code path, stack trace?
* What are the load characteristics? IOPS, throughput, direction (read/write), type?    
  Include variance (standard deviation) where appropriate.
* How is the load changing over time? Is there a daily pattern?

#### Drill-Down Analysis
Study the issue at higher level and narrowing down the focus to the interesting areas, which
allows discarding non interesting areas.

Three-stage drill-down:
* Monitoring: This is used for continually recording high-level statistics over time, and 
  identifying or alerting if a problem may be present.
* Identification: Given a suspected problem, this narrows the investigation to particular 
  resources or areas of interest, identifying possible bottlenecks.
* Analysis: Further examination of particular system areas is done to attempt to root-cause 
  and quantify the issue.

#### Latency Analysis
Breaking down the latency of operations into components and investigating the components
with the highest latency.

#### Method R
Developed specifically for Oracle database.

#### Event Tracing
Studying the events that happened in the system. their latency, events per second, bytes per
second, and any useful metric.
Events Like: Systemcalls, database queries, application transactions, library calls, etc.

ex tool: tcpdump, biosnoop

#### Baseline Statistics
finding a baseline to compare current behaviour of the metric with. ex: other healthy server
the same metric on a previous week.
exeuction is as the following. collect system metrics when the system is under normal load
save these metrics somwhere like a text file. when analysisng the system compare to these 
metrics.

#### Static performance tunning
Go through the system components when there is no load applied and ask the following:
* Does the component make sense? (outdated, underpowered, etc.)
* Does the configuration make sense for the intended workload?
* Was the component autoconfigured in the best state for the intended workload?
* Has the component experienced an error such that it is now in a degraded state?

this method is more concerned with server configuration rather than performance under load.

#### Cache Tuning
Caching guidelines and tunning strategies:
* Aim to cache as high in the stack as possible, closer to where the work is performed, 
  reducing the operational overhead of cache hits. This location should also have more metadata available, which can be used to improve the cache retention policy.
* Check that the cache is enabled and working.
* Check the cache hit/miss ratios and miss rate.
* If the cache size is dynamic, check its current size.
* Tune the cache for the workload. This task depends on available cache tunable parameters.
* Tune the workload for the cache. Doing this includes reducing unnecessary consumers of 
  the cache, which frees up more space for the target workload.

#### Micro-Benchmarking
Test performance of simple and artifical workloads. Macro-Benchmarking is on an actual Real
Workload.
ex: iperf performs a TCP throughput test.

#### Performance Mantras
* Don’t do it.
* Do it, but don’t do it again.
* Do it less.
* Do it later.
* Do it when they’re not looking.
* Do it concurrently.
* Do it more cheaply.

examples:
* Don’t do it: Eliminate unnecessary work.
* Do it, but don’t do it again: Caching.
* Do it less: Tune refreshes, polling, or updates to be less frequent.
* Do it later: Write-back caching.p
* Do it when they’re not looking: Schedule work to run during off-peak hours.
* Do it concurrently: Switch from single-threaded to multi-threaded.
* Do it more cheaply: Buy faster hardware.

## Modeling
Analytical Modeling of the system can be used for various purposes in particular studying
how the system behaves in terms of performance as load or resources increase.
Performance is best understood when at least two of these activities are performed: analytical modeling and simulation, or simulation and measurement.

Modeling means to derive a function that expresses the performance of the system.
https://learning.oreilly.com/api/v2/epubs/urn:orm:book:9780136821694/files/graphics/02fig16.jpg

the previous graphs show common graphs for the functions used to model the system and their
interpretations without using a formal model.
note: coherence means: the tax to maintain data coherncy including the propagation of 
changes. i.e, updating the cache for example write back to the backend store.

the contention graph models a function called Amdahl's law

### Amdahl's Law
C(N) = N/(1 + alpha(N-1))
C(N): Relative capacity
N: Scaling dimension, the dimension which you are scaling. like CPU Count or userload
alpha: between 0 and 1 represents degree of seriality and is how this deviates from linear
       scalability

Amdahl's Law of Scalability can be applied by taking the following steps:
* Collect data for a range of N, either by observation of an existing system or 
  experimentally using micro-benchmarking or load generators.
* Perform regression analysis to determine the Amdahl parameter (α); this may be done using 
  statistical software, such as gnuplot or R.
* Present the results for analysis. The collected data points can be plotted along with the 
  model function to predict scaling and reveal differences between the data and the model. 
  This may also be done using gnuplot or R.

### Universal scalability model (USL)
this is the coherancy scalability graph. this law includes adding a parameter for coherency
delay.
C(N) = N/(1 + alpha(N-1) + beta*N(N-1))
Amdahl's law is when beta=0

### Queueing Theory
modeling of multiple queueing systems is called queueing networks.

- Littles law which determines the average number of requests in a system: L=lamda*W
lamda: average arrival rate
W: average wait time

Queueing systems can be categorized by three factors:

* Arrival process: This describes the inter-arrival time for requests to the queueing 
  system, which may be random, fixed-time, or a process such as Poisson (which uses an 
  exponential distribution for arrival time).
* Service time distribution: This describes the service times for the service center. They 
  may be fixed (deterministic), exponential, or of another distribution type.
* Number of service centers: One or many.

- Kendell's Notation: A/S/m

Examples of commonly studied queueing systems are:
* M/M/1: Markovian arrivals (exponentially distributed arrival times), Markovian service 
  times (exponential distribution), one service center
* M/M/c: same as M/M/1, but multiserver
* M/G/1: Markovian arrivals, general distribution of service times (any), one service center
* M/D/1: Markovian arrivals, deterministic service times (fixed), one service center

#### M/D/1 and 60% Utilization
Queueing theory allows the response time for M/D/1 to be calculated:
r = s(2 - ρ)/2(1 - ρ)
when this function is graphed, it shows that the response time exponentially increases after
60% Utilization.
This is sutiable for disk analysis.

## Capacity planning
Study how well the system will handle load and how it will scale as load scales. *should*
have a quantified objective to plan for.
three items affect capacity planning:
* Resource Limiting
* Factor analysis
* Modeling (the above section)

### Resource Limiting
- measure requests for server over time
- measure resource usage over same time
- draw relation between both
- extrapolate data points to get to know requests rate at first resource that hits 100%U

### Factor Analysis
In this case, there are multiple factors that we need to purchase or choose from to build 
the system. if there are many combinations this can and will get out of hand. so we need
to pick a limited set. here is how to do so:
* Test performance with all factors configured to maximum.
* Change factors one by one, testing performance (it should drop for each).
* Attribute a percentage performance drop to each factor, based on measurements, along with 
  the cost savings.
* Starting with maximum performance (and cost), choose factors to save cost, while 
  maintaining the required requests per second based on their combined performance drop.
* Retest the calculated configuration for confirmation of delivered performance.

### Scaling solutions
* horizontal and vertical scaling
* AWS AutoScalingGroup (ASG)
* Horizontal pods autoscalers (HPAs)
* Database sharding

## Statistics
* Averages: central tendency of data set (arithmatic mean)
* Geometrical mean: nth root of all n elements multiplied. used for network stack 
  improvements
* harmonic mean: count of values / sum of their reciprocals. approppriate for average of
  rates.
* Averages over time: the period on which the average is taken.
* Decayed Average: recent time is weighter more heavily than time further past. reduces
  short term fluctuations in the average.
Averages hide details, they are prune to outliers that may actually be the reason for the
issue.

### std dev, %, median
- standard deviation is how far the data is from the mean.
- 99%, the point where 99% of the data falls under. used in SLAs and monitoring of request
latencies.
- median 50% of data falls under this value.
- Coffecient of Varianve (CoV): how much the data varies. a lower CoV means little variation
  ration between standard deviation and mean
- z: how many standard deviations a value is from the mean

### Multimodal Distributions
above section intended for unimodal data (have only one peak in the normal distribution)
with bimodal data, the average would be misleading.
everytime average latency is used, ask what is the distribution.

### Outliers
For a normal distribution, the presence of outliers is likely to shift the mean by a 
little, but not the median (which may be useful to consider). The standard deviation and 
99th percentile have a better chance of identifying outliers, but this is still dependent 
on their frequency.

# Networks
Network is an important component to investigate and understand.
Network is split into two components: software component and hardware component
software component is the driver and the network interface in the OS.
hardware component is the network controller and the network interface card

Host
  Network interface   -> Network interface card
                              Network Controller
                                  port             -> Network

## Protocol Stack

TCP/IP                   OSI                Examples                    message name
Application           Application           HTTP, DNS
                      Presentation          SSL, TLS
                      Session               RPC
Transport             Transport             TCP/UDP                      datagram
Internet              Network               IPv4, IPv6                   packet
DataLink              DataLink              Ethernet, Wireless           frame
Physical              Physical              Copper/Fiber, Signals

## Encapsulation
Adds metadata to payload by appending a header, a footer, or both.

[EthernetHeader E.H][IP][TCP][Payload][EthernetFooter E.F]

## Packet Size
* Large packets improve throughput and reduce packet overhead.
* packets can be netween 54-9054 (Jumbo Buffers) bytes
* MTU (Maximum Transmission Unit) limits packet size and is usually 1500 bytes
* For older hardware jumbo buffers are not functional and some rules like packages above
  1500 bytes are silently dropped have been implemented
* TCP offload: network cards send packets that are 9000 bytes and network cards on the other
  side fragments them without having to use the CPU -> reduced gap between MTU and Jumbo

## Latency
* Name Resolution latency:
  * resolving host name to ip DNS name resolution timeouts, OS caching, direct IP
* Ping latency
  * ICMP Echo, time for round trip, time between two hosts,
* connection latency
  * time before data is sent, SYN -> SYN-ACK, retrans of dropped SYN (server queue full) 
    included
* first-byte latency
  * time to first byte (TTFB)
  * after connection latency
  * include time to accept connection, schedule thread to service it, and for thread to 
    execute and send the first byte.
* rount-trip
  * network request makes round trip, signal propagation time, processing time at each hop
  * determines latency of the network
  * dominated by time packets spend on the network, not host servicing request
* connection life span
  * Time from connection established to closed
  * keep-alive strategy, use the same connection.

## Buffering
* on sender and receiver
* keeps network throughput high
* TCP uses buffering with sliding window
* Network sockets
* Applications
* Switches routers bad to use buffers causes tcp congestion on host

## Connection backlog
* backlog of receiving connection as buffer
* has a limit SYN packets are dropped after
* Drop and SYN Retransmit = host over loaded

## Interface negotiation
* Bandwidth negotation (sending with 1, 10, 100...100000 MBits/s)
* Duplex: half (one direction at a time), full (send, recieve)

## Congestion avoidance
* Ethernet: pause frame
* IP: explicit congestion notification
* TCP: Congestion window and various algorithms

## Utilization
* Current throughput / max bandwidth (normally negotiated bandwidth)
* Packet sizes differ so can't relate to utilization in this case

## Local Connections
* local applications connecting via network
* TCP friends, linux feature, detect apps same host, shortcut the tcp connection. not merged
* ^ use BPF
  
## Architecture
### IP
* field to controll performance
* Type of service in IPv4, Traffic Class in IPv6
* Differentiated services code point (DSCP) redfined these fields
* DSCP Supports different service classes, each class contains different characteristics
  * packet drop probability
  * telephony
  * broadcast video
  * low-latency data
  * high-throughput data
  * low-priority data
* ECN packet to signal congestion instead of dropping packet. bit in IP header
* echoed back to sender to throttle transmission

### TCP
* provide high throughput on high latency networks via buffering and sliding window
* Congestion control and congestion window set by sender
* Sliding Window: allows multiple packets to be sent before receiving acks. size of window
  set by reciever
* Congestion Avoidance
* Slow Start: part of congestion control.begins with a small window then increases as acks
  are recieved in certain time and reduced if acks not sent in that time
* selective acks (sacks): ack discontinous packets
* fast retransmit: if duplicate acks tcp retransmits instead of waiting on timer
* fast recovery: if duplicate acks reset to slow start
* fast open: include data in SYN
* timestamps: included in acks -> measure RTT
* SYN Cookies: provide encrypted SYN to help legetimize clients
* features implemented by options added to header

### Three way handshake










