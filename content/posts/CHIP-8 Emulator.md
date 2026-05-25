---
title: "CHIP-8 Emulator"
date: 2023-08-09
description: "Building a CHIP-8 interpreter and emulator from scratch in C++, covering opcodes, display, timers, and input handling."
tags: ["c++", "emulation", "graphics", "low-level"]
draft: false
---
Lately, I’ve been looking for a side project to work on outside my daytime internship. I’ve always loved emulators for their ability to bring back old retro games, so I figured it would be interesting to understand how emulators work and even try my hand at building one myself!

After doing some research, I found that most experienced emulator developers, who take emulation programming seriously, advise beginners to start with something simple, like the CHIP-8, instead of diving directly into NES or Game Boy emulation :)

1. [{{< colour color="#FEFE54" >}}CHIP-8{{< /colour >}}](#chip-8) 
2. [{{< colour color="#FEFE54" >}}What is Emulation & What is an Emulator?{{< /colour >}}](#what-is-emulation--what-is-an-emulator)
3. [{{< colour color="#FEFE54" >}}The Hardware{{< /colour >}}](#the-hardware)
4. [{{< colour color="#FEFE54" >}}CHIP-8 Class{{< /colour >}}](#class-members)
5. [{{< colour color="#FEFE54" >}}The Instructions{{< /colour >}}](#the-instructions)
6. [{{< colour color="#FEFE54" >}}Fetching, Decoding, and Executing opcodes{{< /colour >}}](#fetching-decoding-and-executing-opcodes)
7. [{{< colour color="#FEFE54" >}}The Window Layer{{< /colour >}}](#the-window-layer)
8. [{{< colour color="#FEFE54" >}}The Main Loop{{< /colour >}}](#the-main-loop)
9. [{{< colour color="#FEFE54" >}}In Action!{{< /colour >}}](#in-action)	
10. [{{< colour color="#FEFE54" >}}Conclusion{{< /colour >}}](#conclusion)
11. [{{< colour color="#FEFE54" >}}Source Code{{< /colour >}}](#source-code)

#### CHIP-8
The CHIP-8 system was not a physical machine; rather, it was a virtual machine designed for early microcomputers. It functioned as an interpreted programming language, where programmers could write programs using a specific set of instructions (opcodes). These programs were intended to be executed by a CHIP-8 interpreter, which would decode the instructions and execute them on the target machine.

Since the CHIP-8 was a virtual machine, the same programs written for it could be executed on different machines as long as they had an interpreter specifically designed to interpret CHIP-8 instructions. This portability was one of the advantages of using a virtual machine.

What I plan to do is to create an emulator that simulates the behavior of a CHIP-8 interpreter. The emulator will read and interpret CHIP-8 programs, executing the corresponding instructions, and simulating the virtual machine's behavior. By doing so, we'll be able to run existing CHIP-8 programs on our emulator, just as they would have run on a physical machine with a CHIP-8 interpreter.

While strictly speaking, what we're building is an interpreter for the CHIP-8 virtual machine, it's common to refer to this kind of project as an "emulator" since it emulates the behavior of the virtual machine on modern hardware. Let me now list a few reasons why I personally believe it is an excellent fit for beginners:

1. **{{< colour color="#FEFE54" >}}Simplicity{{< /colour >}}**: CHIP-8 has a simple architecture with a limited set of opcodes (only 35 instructions). This simplicity allows grasping the fundamentals of emulator development and low-level computer fundamentals without getting overwhelmed by complex hardware interactions.

2. **{{< colour color="#FEFE54" >}}Educational Value{{< /colour >}}**: Building a CHIP-8 emulator serves as an excellent educational experience. You'll learn about CPU instruction decoding, memory management, and other essential emulator components that are applicable to more advanced emulators.

3. **{{< colour color="#FEFE54" >}}Abundance of Resources{{< /colour >}}**: CHIP-8 is a well-known and widely documented system, and there are numerous tutorials, articles, and open-source implementations available online.
 
4. **{{< colour color="#FEFE54" >}}Retro Appeal (my favorite){{< /colour >}}**: By working on a CHIP-8 emulator, you'll have the chance to revive classic retro games and experience computing history firsthand.

#### What is Emulation & What is an Emulator?
When it comes to explaining emulation, some people tend to go into a lot of technical details, but I prefer to think of it simply as replicating hardware in software. Essentially, it's about creating software that mimics the functionality and behavior of the emulated system. Emulators are designed to read the original machine code instructions (opcodes) that were initially created for the target machine, which is the system being emulated. These opcodes represent the low-level instructions that the original hardware of the target machine can understand and execute.

The primary task of the emulator is to interpret these opcodes and then recreate the functionality and behavior of the target machine on the host machine. In other words, it's like making your computer act and function as if it were the original system, allowing you to run software and games designed for that specific machine on your modern computer.

> ##### Note:
> When dealing with older gaming consoles or computer systems, the software and games were often distributed and stored on ROM (Read-Only Memory) files or cartridges. These files contain the binary data representing the original machine code instructions for the target system. In the context of emulation, ROM files and cartridges act as the source material that the emulator needs to read and interpret.
>

#### The Hardware 
Now that we have an idea of how emulators work, we'd like to mimic the components of a CHIP-8, let's talk about them:

1. **{{< colour color="#FEFE54" >}}Sixteen 8-bit registers (V0-VF){{< /colour >}}**: 

Registers are small, fast dedicated locations on a CPU for storage. The CPU uses these registers to hold data temporarily during its operations. Since registers are located within the CPU itself, accessing data from registers is faster than retrieving data from main memory (RAM). But a CPU typically only has a few registers, so long-term data is held in memory instead. CPU operations often involve loading data from memory into registers, performing operations on these registers (such as arithmetic or logical operations), and storing the results back into memory.

In the CHIP-8, there are sixteen 8-bit registers, which are identified by the labels V0 to VF. Each register can hold a value ranging from 0x00 to 0xFF (0 to 255 in decimal). Being 8-bit, the registers can represent values in the range of a single byte (2^8 = 256).

The V0 to VE registers are general-purpose registers used for various purposes. The VF register, however, is often used as a flag to hold information about the result of operations or carry/borrow register. It is special because certain arithmetic and logical operations update VF with specific information. For example, if an addition operation between two values results in a carry (a value greater than 255 in 8-bit arithmetic), the VF register is set to 1, indicating a carry. Similarly, if a subtraction operation results in a borrow (a negative result), the VF register may be set to 0 to indicate a borrow.

2. **{{< colour color="#FEFE54" >}}Memory of 0x1000 (4K or 4096) bytes{{< /colour >}}**: 

Because of the relatively little register-space (due to a trade-off between cost, complexity, and performance), a computer needs a large chunk of general memory to hold long-term data, short-term data, and program instructions. Different locations in memory are referenced using an address.

The CHIP-8 provides 4096 bytes of memory, covering an address space ranging from 0x000 to 0xFFF. As seen below.

{{< highlight plaintext >}}
+---------------+= 0xFFF (4095) End of Chip-8 RAM
|               |
|               |
|               |
|               |
|               |
| 0x200 to 0xFFF|
|     Chip-8    |
| Program / Data|
|     Space     |
|               |
|               |
|               |
|				|
|               |
|               |
|               |
+---------------+= 0x200 (512) Start of most Chip-8 programs
| 0x000 to 0x1FF|
| Reserved for  |
|  interpreter  |
+---------------+= 0x000 (0) Start of Chip-8 RAM
{{< /highlight >}}

The address space is segmented into two sections:
- The first 0x200 (512) bytes, from 0x000-0x1FF are reserved for the CHIP-8 interpreter itself. As a result, these memory locations should not be used by the programs written in the CHIP-8 language.
- 0x200-0xFFF: Most CHIP-8 programs (Instructions from the ROM) start at location 0x200.

> ##### Note:
> There's a storage space (80 bytes in total) from 0x050-0x0A0 dedicated for the 16 built-in characters (0 through F), which we will need to manually put into our memory because ROMs (or CHIP-8 programs) will be looking for those characters to display text or symbols. Each character occupies 5 bytes of memory.
>

3. **{{< colour color="#FEFE54" >}}16-bit Index Register (I){{< /colour >}}**:

The index register serves as a memory pointer or memory address register; it holds a memory address that points to a specific location in memory. When a CHIP-8 program needs to access data from or store data to a particular memory location, it can use the index register to specify that memory address. Using a 16-bit index register in CHIP-8 allows it to address the entire 4KB memory space (65,536 locations), whereas an 8-bit index register would be limited to 256 locations, insufficient for the full memory coverage.

4. **{{< colour color="#FEFE54" >}}16-bit Program Counter (PC){{< /colour >}}**:

The Program Counter plays a central role in executing programs; it is a special register that keeps track of the memory address of the next instruction to be fetched and executed by the CPU.

> ##### Note:
> In the CHIP-8 system, each instruction is represented by a 2-byte opcode, but memory addresses are single bytes. To fetch an instruction, we read a byte from the memory address pointed to by the program counter (PC) and another byte from PC+1, then combine them to form the full opcode. **{{< colour color="#fefe54" >}}After fetching, we increment the PC by 2 before executing instructions{{< /colour >}}** because some instructions modify the PC to control the program flow, either adding, subtracting, or completely changing its value.
>

5. **{{< colour color="#FEFE54" >}}16-level Stack{{< /colour >}}**:

The stack is a fundamental component used for managing the program's execution flow. In simple terms, the stack is like a temporary storage area that helps the CPU remember where it was in the program before it jumps to another part of the program. For example, when the CPU encounters a "CALL" instruction, it needs to remember the memory address of the next instruction after the call. To do this, it **{{< colour color="#fefe54" >}}puts{{< /colour >}}** that memory address (the value of the program counter, PC) onto the stack. After executing a subroutine or function called by the "CALL" instruction, the CPU needs to go back to where it was in the main program. The "RETURN" (RET) instruction does this by **{{< colour color="#fefe54" >}}pulling{{< /colour >}}** the memory address (the value) from the top of the stack and setting the program counter (PC) to that value. This allows the CPU to continue executing the main program from where it left off.

The CHIP-8 stack can remember up to 16 different memory addresses (levels). This allows for nested function calls, meaning one function can call another function, and so on, until they all return to their original calling points. The process of putting a memory address onto the stack is called "pushing," and the process of taking a memory address off the stack is called "popping."

6. **{{< colour color="#FEFE54" >}}8-bit Stack Pointer (SP){{< /colour >}}**:

This guy right here is the manager of the stack. The stack pointer is used to keep track of the current level of the stack, indicating the next available position in memory to push data onto the stack or pop data from it.

The stack in CHIP-8 emulator can be represented as an array, making the 8-bit stack pointer function as an index to manage the stack's 16 levels efficiently (0-15). When popping a value, the stack pointer decrements to the previous position, copying the value instead of deleting it. Deleting data from an array (the stack) would require additional operations to shift the remaining elements down in the memory to fill the gap left by the deleted value. This process is not so efficient.

7. **{{< colour color="#FEFE54" >}}8-bit Delay Timer & 8-bit Sound Timer{{< /colour >}}**:

The CHIP-8 includes two timers: the Delay Timer and the Sound Timer. Both timers are 8-bit registers that count down at a rate of 60Hz, which means they decrease their value 60 times per second.

- Delay Timer: Used for timing. If the timer value is zero, it stays zero. If it is loaded with a value, it will decrement at a rate of 60Hz (60 times per second).
- Sound Timer: Same behavior, but used for simple sound emission.

8. **{{< colour color="#FEFE54" >}}16 input built-in characters "keys" {{< /colour >}}**:

There are 16 input keys that serve as the primary means of interaction with the program or game being run. These input keys are typically represented by a hexadecimal keypad layout, with labels ranging from 0 to F. Each key is either pressed or not pressed.

I'll be using this input mapping:

{{< highlight plaintext >}}
Keypad       Keyboard
+-+-+-+-+    +-+-+-+-+
|1|2|3|C|    |3|4|5|6|
+-+-+-+-+    +-+-+-+-+
|4|5|6|D|    |E|R|T|Y|
+-+-+-+-+ => +-+-+-+-+
|7|8|9|E|    |D|F|G|H|
+-+-+-+-+    +-+-+-+-+
|A|0|B|F|    |C|V|B|N|
+-+-+-+-+    +-+-+-+-+
{{< /highlight >}}


9. **{{< colour color="#FEFE54" >}}64x32-pixel Monochrome Display{{< /colour >}}**:

It consists of a 64x32 monochrome pixel grid, meaning it has 64 columns and 32 rows of pixels. The pixels can only be in an "on" or "off" state, giving the display a simple black-and-white appearance (only two colors). The CHIP-8 display operates with a single bit per pixel, where a "1" represents an "on" or lit pixel, and a "0" represents an "off" or unlit pixel. This simplicity makes it easy to work with graphics and allows for straightforward rendering of images and animations.


{{< highlight plaintext >}}
................................
..........11.....11.............
..........11.....11.............
..........11.....11.............
..........11.....11.............
...........1111111..............
................................
..
..
..

{{< /highlight >}}

#### Class Members
Now, let's replicate our components in software. The class data members look like this:

```cpp
#include <cstdint>

class Chip8
{
private:
	uint8_t registers[16]{};
	uint8_t memory[4096]{};
	uint16_t indexRegister{};
	uint16_t pc{};
	uint16_t stack[16]{};
	uint8_t sp{};
	uint16_t opcode{};
	uint8_t delayTimer{};
	uint8_t soundTimer{};
	uint8_t keypad[16]{};
	uint32_t display[64 * 32]{};
};

```

Firstly, let's handle loading the CHIP-8 program, we need to load the contents of a ROM file so that we can have all the instructions in memory before we can execute them.

```cpp
#include <iostream>
#include <fstream>

void Chip8::loadROM(const char* romFileName)
{
	// Open the ROM file in binary mode
	std::ifstream file(romFileName, std::ios::binary);

	if (!file)
	{
		std::cerr << "Error: Failed to open ROM file." << std::endl;
		return;
	}

	// Move the input (get) pointer to the end of the file, and get the size of the ROM file
	file.seekg(0, std::ios::end);
	std::streampos fileSize = file.tellg();
	
	if (fileSize > MEMORY_SIZE - PROGRAM_START_ADDRESS) {
		std::cerr << "Error: ROM size exceeds available memory." << std::endl;
		return;
	}

	// Go back to the beginning of the file
	file.seekg(0, std::ios::beg);
	
	// Read the ROM data into memory starting at address 0x200 (512)
	file.read(reinterpret_cast<char*>(memory + 0x200), fileSize);

	file.close();
	std::cout << "Successfully loaded ROM: " << romFileName << std::endl;
}
```
As mentioned earlier, the first 0x200 (512) bytes of the CHIP-8's memory are reserved for the interpreter, so the ROM instructions must start at 0x200.

Now that the starting address is known and decided, we can assign it to the program counter in the constructor!

```cpp
Chip8::Chip8()
{
	pc = PROGRAM_START_ADDRESS;
}
```
I mentioned earlier that there are 16 built-in characters (0 through F) we need to manually put into our memory because ROMs (or CHIP-8 programs) will be looking for those characters to display text or symbols. Each character is 5 bytes long, and we can store these fonts directly in memory starting at address 0x050.

```cpp
Chip8::Chip8()
{
	pc = PROGRAM_START_ADDRESS;

	// Font data for the characters 0-F (16), each is 5 bytes long
	uint8_t fontSet[16*5] = {
		0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
		0x20, 0x60, 0x20, 0x20, 0x70, // 1
		0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
		0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
		0x90, 0x90, 0xF0, 0x10, 0x10, // 4
		0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
		0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
		0xF0, 0x10, 0x20, 0x40, 0x40, // 7
		0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
		0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
		0xF0, 0x90, 0xF0, 0x90, 0x90, // A
		0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
		0xF0, 0x80, 0x80, 0x80, 0xF0, // C
		0xE0, 0x90, 0x90, 0x90, 0xE0, // D
		0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
		0xF0, 0x80, 0xF0, 0x80, 0x80  // F
	};

	// Load the fonts into memory starting at address 0x050 to 0x0A0 (80 bytes)
	for (unsigned int i = 0; i < (16*5); ++i)
	{
		memory[FONTSET_START_ADDRESS + i] = fonts[i];
	}
}

```
In CHIP-8, a sprite is a pattern of pixels represented by a set of 5 bytes. Each byte in the set corresponds to a row of pixels in the sprite, and each bit within the byte represents whether a pixel at that position is "on" (1) or "off" (0).

Let's take an example of a simple sprite for the number "1". To visualize the sprite, we can convert each byte into its binary representation:

{{< highlight plaintext >}}
0x20 --> 00{1}00000
0x60 --> 0{11}00000
0x20 --> 00{1}00000
0x20 --> 00{1}00000
0x70 --> 0{111}0000
{{< /highlight >}}

The sprite represents the number "1" correctly. The "on" pixels (1s) are where the number "1" is drawn, and the "off" pixels (0s) are where the background is left empty. If you can't see it properly, {{< coloredLink url="https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Technical-Reference#fonts" color="#FEFE54" >}}check this{{< /coloredLink >}}.

#### The Instructions
The CHIP-8 has {{< coloredLink url="https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Instruction-Set" color="#FEFE54" >}}35 instructions{{< /coloredLink >}}
that we need to emulate.
*****

****{{< colour color="#FEFE54" >}}00E0 - Clear the screen{{< /colour>}}****

We emulate this by setting the entire display buffer to zeros.

```cpp
void Chip8::OP_00E0()
{
	memset(display, 0, sizeof(display));
}
```

****{{< colour color="#FEFE54" >}}00EE - Return from a subroutine (RET){{< /colour>}}****

Subroutines are sections of code that can be called and later returned from. Let me break down the emulation of this:

1. When you call a subroutine using the CALL instruction, the address of the next instruction after the CALL is saved on the stack.

2. The 00EE instruction is used to return from that subroutine. It does this by:
	- Taking the address from the top of the stack (the one that was saved during the CALL).
	- Moving the stack pointer down to the previous level on the stack.
	- Setting the program counter (pc) to the retrieved address.
```cpp
void Chip8::OP_00EE()
{
	--sp;
	pc = stack[sp];
}
```
****{{< colour color="#FEFE54" >}}1NNN - Jump (JMP) to address NNN{{< /colour>}}****

For the jump instruction, no stack interaction is required. We just set the program counter to the address NNN. '1' here is the opcode for the jump instruction, and 'NNN' represents the address. We'll need to extract the address NNN from the opcode.

```cpp
void Chip8::OP_1NNN()
{
	uint16_t address = opcode & 0x0FFFu;
	pc = address;
}
```
We use a bitwise AND operation (opcode & 0x0FFF) to extract the lower 12 bits (NNN) of the instruction.

{{< highlight plaintext >}}
Opcode: 0001 NNNN NNNN NNNN
Mask:   0000 1111 1111 1111
Result: 0000 NNNN NNNN NNNN
{{< /highlight >}}

****{{< colour color="#FEFE54" >}}2NNN - Execute subroutine starting at address NNN{{< /colour>}}****

We extract the lower 12 bits (NNN) from the opcode using a bitwise AND operation. The current program counter (PC) is saved onto the stack, enabling a return point, and the stack pointer (SP) is incremented. Then, the program counter is updated to the specified subroutine address, effectively branching to a new section of code.

```cpp
void Chip8::OP_2NNN()
{
	uint16_t address = opcode & 0x0FFFu;

	stack[sp] = pc;
	++sp;
	pc = address;
}
```
****{{< colour color="#FEFE54" >}}3XNN - Skip the following instruction if the value of register VX equals NN{{< /colour>}}****

First, we extract the register index X from the opcode. The opcode is shifted right by 8 bits to get the bits corresponding to X, and then masked with 0x000F to ensure we only get the lowest 4 bits. Then we extract the constant value NN from the opcode by masking it with 0x00FF to get the lowest 8 bits. If they're equal, we skip the next instruction by increasing the PC by 2. **{{< colour color="#FEFE54" >}}Remember{{< /colour>}}** that our PC has already been incremented by 2 in **{{< colour color="#FEFE54" >}}emulateCycle(){{< /colour>}}**, we just increment by 2 again to skip the next instruction.

```cpp
void Chip8::OP_3XNN()
{
	uint8_t VX = (opcode >> 8u) & 0x000Fu;
	uint8_t ValueNN = opcode & 0x00FFu;

	if (registers[VX] == ValueNN)
	{
		pc += 2; // Skip the next instruction
	}
}
```
****{{< colour color="#FEFE54" >}}4XNN - Skip the following instruction if the value of register VX is not equal to NN{{< /colour>}}****

```cpp
void Chip8::OP_4XNN()
{
	uint8_t VX = (opcode >> 8u) & 0x000Fu;
	uint8_t ValueNN = opcode & 0x00FFu;

	if (registers[VX] != ValueNN)
	{
		pc += 2; // Skip the next instruction
	}
}
```
****{{< colour color="#FEFE54" >}}5XY0 - Skip the following instruction if the value of register VX is equal to the value of register VY{{< /colour>}}****

```cpp
void Chip8::OP_5XY0()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	if (registers[VX] == registers[VY])
	{
		pc += 2; // Skip the next instruction
	}
}
```
****{{< colour color="#FEFE54" >}}6XNN - Store number NN in register VX{{< /colour>}}****

```cpp
void Chip8::OP_6XNN()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t ValueNN = opcode & 0x00FFu;

	registers[VX] = ValueNN;
}
```
****{{< colour color="#FEFE54" >}}7XNN - Add the value NN to register VX{{< /colour>}}****
```cpp
void Chip8::OP_7XNN()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t ValueNN = opcode & 0x00FFu;

	registers[VX] += ValueNN;
}
```
****{{< colour color="#FEFE54" >}}8XY0 - Store the value of register VY in register VX{{< /colour>}}****

```cpp
void Chip8::OP_8XY0()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	registers[VX] = registers[VY];
}
```

****{{< colour color="#FEFE54" >}}8XY1 - Set VX to VX OR VY{{< /colour>}}****

```cpp
void Chip8::OP_8XY1()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	registers[VX] |= registers[VY];
}
```
****{{< colour color="#FEFE54" >}}8XY2 - Set VX to VX AND VY{{< /colour>}}****

```cpp
void Chip8::OP_8XY2()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	registers[VX] &= registers[VY];
}
```
****{{< colour color="#FEFE54" >}}8XY3 - Set VX to VX XOR VY{{< /colour>}}****
```cpp
void Chip8::OP_8XY3()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	registers[VX] ^= registers[VY];
}
```
****{{< colour color="#FEFE54" >}}8XY4 - Add the value of register VY to register VX, Set VF to 01 if a carry occurs or 00 if a carry does not occur{{< /colour>}}****

We add the value of register VY to register VX. If the result is greater than 8 bits (i.e., greater than 255), set the carry flag (VF) to 1, otherwise set it to 0. Store the result in register VX.

```cpp
void Chip8::OP_8XY4()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	// Perform the addition
	uint16_t sum = registers[VX] + registers[VY];

	// Set the carry flag (VF) if result is greater than 255
	registers[0xF] = (sum > 255) ? 1 : 0;

	// Store the result in VX (lower 8 bits)
	registers[VX] = sum & 0xFFu;
}
```
****{{< colour color="#FEFE54" >}}8XY5 - Subtract the value of register VY from register VX, Set VF to 00 if a borrow occurs or 01 if a borrow does not occur{{< /colour>}}****

```cpp
void Chip8::OP_8XY5()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	// Set borrow flag (VF) if Vx >= Vy
	registers[0xF] = (registers[VX] >= registers[VY]) ? 1 : 0;

	// Perform the subtraction
	registers[VX] -= registers[VY];
}

```

****{{< colour color="#FEFE54" >}}8XY6 - Shift Right and Store LSB{{< /colour>}}****

We need to store the value of register VY shifted right one bit (divided by 2) in register VX, Set register VF to the least significant bit prior to the shift.

```cpp
void Chip8::OP_8XY6()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	// Store the LSB of VY in VF
	registers[0xF] = registers[VY] & 0x1u;

	// Perform the right shift operation
	registers[VX] = registers[VY] >> 1;
}
```

****{{< colour color="#FEFE54" >}}8XY7 - Set register VX to the value of VY minus VX, Set VF to 00 if a borrow occurs or 01 if a borrow does not occur{{< /colour>}}****

```cpp
void Chip8::OP_8XY7()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	if (registers[VY] > registers[VX])
	{
		registers[0xF] = 1;
	}
	else
	{
		registers[0xF] = 0;
	}

	registers[VX] = registers[VY] - registers[VX];
}
```

****{{< colour color="#FEFE54" >}}8XYE - Bitwise Shift Left with Carry{{< /colour>}}****
```cpp
void Chip8::OP_8XYE()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	// Save MSB in VF
	registers[0xF] = (registers[VX] >> 7u) & 0x1u;

	registers[VX] <<= 1;
}
```
****{{< colour color="#FEFE54" >}}9XY0 - Skip the following instruction if the value of register VX is not equal to the value of register VY{{< /colour>}}****

```cpp
void Chip8::OP_9XY0()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t VY = (opcode >> 4u) & 0x0Fu;

	if (registers[VX] != registers[VY])
	{
		pc += 2;
	}
}
```
****{{< colour color="#FEFE54" >}}ANNN - Store memory address NNN in register I (Index Register){{< /colour>}}****
```cpp
void Chip8::OP_ANNN()
{
	uint16_t address = opcode & 0x0FFFu;

	indexRegister = address;
}
```
****{{< colour color="#FEFE54" >}}BNNN - Jump to address NNN + V0{{< /colour>}}****
```cpp
void Chip8::OP_BNNN()
{
	uint16_t address = opcode & 0x0FFFu;

	pc = registers[0x0] + address;
}
```
****{{< colour color="#FEFE54" >}}CXNN - Set VX to a random number with a mask of NN{{< /colour>}}****
```cpp
void Chip8::OP_CXNN()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t ValueNN = opcode & 0x00FFu;

	// Generate a random byte
	uint8_t randomValue = std::rand() & 0xFFu;

	registers[VX] = randomValue & ValueNN;
}
```
****{{< colour color="#FEFE54" >}}DXYN - Drawing a sprite{{< /colour>}}****

Draw a sprite at coordinates (VX, VY) with a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read from memory at location I (index register). VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 otherwise.

```cpp
void Chip8::OP_DXYN()
{
	uint8_t VX = registers[(opcode >> 8u) & 0x0Fu];
	uint8_t VY = registers[(opcode >> 4u) & 0x0Fu];
	uint8_t height = opcode & 0x000Fu;

	registers[0xF] = 0;

	for (uint8_t row = 0; row < height; ++row)
	{
		uint8_t spriteByte = memory[indexRegister + row];

		for (uint8_t col = 0; col < 8; ++col)
		{
			uint8_t spritePixel = spriteByte & (0x80u >> col);
			uint32_t* screenPixel = &display[(VX + col) + (VY + row) * DISPLAY_WIDTH];

			// Map the sprite pixel to the corresponding RGBA value.
			uint32_t rgbaSpritePixel = spritePixel ? 0xFFFFFFFF : 0x00000000;

			if (spritePixel && *screenPixel == 0xFFFFFFFF)
			{
				registers[0xF] = 1; // Set collision flag
			}

			// XOR the sprite pixel onto the screen
			*screenPixel ^= rgbaSpritePixel;
		}
	}
}
```
Mapping sprite pixels to RGBA values enables the monochromatic CHIP-8 display to be visualized on modern color screens (where RGBA representation is popular). This translation provides flexibility in representation and ensures compatibility with current display tech.

****{{< colour color="#FEFE54" >}}EX9E - Skip the following instruction if the key corresponding to the hex value currently stored in register VX is pressed{{< /colour>}}****

```cpp
void Chip8::OP_EX9E()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	
	if (keypad[registers[VX]])
	{
		pc += 2;
	}
}
```
****{{< colour color="#FEFE54" >}}EXA1 - Skip the following instruction if the key corresponding to the hex value currently stored in register VX is not pressed{{< /colour>}}****

```cpp
void Chip8::OP_EXA1()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	if (!keypad[registers[VX]])
	{
		pc += 2;
	}
}
```
****{{< colour color="#FEFE54" >}}FX07 - Store the current value of the delay timer in register VX{{< /colour>}}****

```cpp
void Chip8::OP_FX07()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	registers[VX] = delayTimer;
}
```

****{{< colour color="#FEFE54" >}}FX0A - Wait for a keypress and store the result in register VX{{< /colour>}}****

```cpp
void Chip8::OP_FX0A()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	bool keyPressed = false;
	for (unsigned int i = 0; i < 16; ++i)
	{
		if (keypad[i])
		{
			registers[VX] = static_cast<uint8_t>(i);
			keyPressed = true;
			break;
		}

		// If no key is pressed, repeat the instruction to wait for a key press
		if (!keyPressed)
		{
			pc -= 2;
		}
	}

}
```

****{{< colour color="#FEFE54" >}}FX15 - Set the delay timer to the value of register VX{{< /colour>}}****

```cpp
void Chip8::OP_FX15()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	delayTimer = registers[VX];
}
```

****{{< colour color="#FEFE54" >}}FX18 - Set the sound timer to the value of register VX{{< /colour>}}****

```cpp
void Chip8::OP_FX18()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	soundTimer = registers[VX];
}
```
****{{< colour color="#FEFE54" >}}FX1E - Add the value stored in register VX to register I (index register){{< /colour>}}****

```cpp
void Chip8::OP_FX1E()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	indexRegister += registers[VX];
}
```

****{{< colour color="#FEFE54" >}}FX29 - Set register I to the memory address of the sprite data corresponding to the hexadecimal digit stored in register VX{{< /colour>}}****

This instruction is commonly used for drawing characters and symbols on the screen.
```cpp
void Chip8::OP_FX29()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t digit = registers[VX];

	// Font characters are stored in memory starting at address 0x50, each is 5 bytes long
	indexRegister = FONTSET_START_ADDRESS + (5 * digit);
}
```
****{{< colour color="#FEFE54" >}}FX33 - Store the binary-coded decimal (BCD) equivalent of the value stored in register VX at addresses I, I + 1, and I + 2{{< /colour>}}****

This instruction converts the decimal value stored in register Vx into its binary-coded decimal (BCD) representation and stores it in memory starting at the memory address stored in the index register (I).

To achieve this, we need to extract the hundreds, tens, and ones digits from the value in register Vx. This is done using division and modulo operations.

```cpp
void Chip8::OP_FX33()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;
	uint8_t value = registers[VX];

	// Extract hundreds, tens, and ones digits
	uint8_t hundreds = value / 100;
	uint8_t tens = (value / 10) % 10;
	uint8_t ones = value % 10;

	// Store BCD representation in memory
	memory[indexRegister] = hundreds;
	memory[indexRegister + 1] = tens;
	memory[indexRegister + 2] = ones;
}
```
Look at this example here:
{{< highlight plaintext >}}
Value in VX: 456
Hundreds: 456/100 = {4}
Tens: (456 / 10) % 10 = {5}
Ones: 456 % 10 = {6}
{{< /highlight >}}

****{{< colour color="#FEFE54" >}}FX55 - Store the values of registers V0 to VX inclusive in memory starting at address I{{< /colour>}}****

This is used to store the values of registers V0 through VX (inclusive) into memory starting at the address pointed to by the index register (I).

```cpp
void Chip8::OP_FX55()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	for (uint8_t i = 0; i <= VX; ++i)
	{
		memory[indexRegister + i] = registers[i];
	}
}
```
****{{< colour color="#FEFE54" >}}FX65 - Fill registers V0 to VX inclusive with the values stored in memory starting at address I{{< /colour>}}****

```cpp
void Chip8::OP_FX65()
{
	uint8_t VX = (opcode >> 8u) & 0x0Fu;

	for (uint8_t i = 0; i <= VX; ++i)
	{
		registers[i] = memory[indexRegister + i];
	}
}
```

> ##### Note
> Some CHIP-8 implementations for the last two opcodes (FX55 and FX65) also increase the index register by the value of VX + 1 after executing these opcodes. This is a source of variation among different CHIP-8 implementations. The provided code does not include this behavior, so you may want to verify if it's required for a specific game or program you want to emulate!
>

****{{< colour color="#FEFE54" >}}0NNN - Execute machine language subroutine at address NNN{{< /colour>}}****

I left the discussion of the 0NNN opcode until last since this opcode is also known as a "no operation", it lacks a specific role in CHIP-8 emulation and is often excluded to optimize performance. It was originally designed for compatibility with older programs, but its absence doesn't impact the functionality of modern CHIP-8 applications.  As a result, I'll exclude its implementation!

#### Fetching, Decoding, and Executing opcodes

The ****{{< colour color="#FEFE54" >}}emulateCycle(){{< /colour>}}**** fetches the opcode from memory, decodes it using a switch statement, executes the corresponding operation, updates the timers, and increments the program counter.

```cpp
void Chip8::emulateCycle()
{
	// Fetch opcode
	opcode = memory[pc] << 8u | memory[pc + 1];
	
	// Increment the PC before executing anything
	pc += 2;

	// Decode and execute opcode
	switch (opcode & 0xF000u)
	{
	case 0x0000u:
		switch (opcode & 0x000Fu)
		{
		case 0x0000u:
			OP_00E0();
			break;
		case 0x000Eu:
			OP_00EE();
			break;
		default:
			std::cerr << "Invalid opcode: 0x" << std::hex << opcode << std::endl;
			break;
		}
		break;
	case 0x1000u:
		OP_1NNN();
		break;
	case 0x2000u:
		OP_2NNN();
		break;
	case 0x3000u:
		OP_3XNN();
		break;
	case 0x4000u:
		OP_4XNN();
		break;
	case 0x5000u:
		OP_5XY0();
		break;
	case 0x6000u:
		OP_6XNN();
		break;
	case 0x7000u:
		OP_7XNN();
		break;
	case 0x8000u:
		switch (opcode & 0x000Fu)
		{
		case 0x0000u:
			OP_8XY0();
			break;
		case 0x0001u:
			OP_8XY1();
			break;
		case 0x0002u:
			OP_8XY2();
			break;
		case 0x0003u:
			OP_8XY3();
			break;
		case 0x0004u:
			OP_8XY4();
			break;
		case 0x0005u:
			OP_8XY5();
			break;
		case 0x0006u:
			OP_8XY6();
			break;
		case 0x0007u:
			OP_8XY7();
			break;
		case 0x000Eu:
			OP_8XYE();
			break;
		default:
			std::cerr << "Invalid opcode: 0x" << std::hex << opcode << std::endl;
			break;
		}
		break;
	case 0x9000u:
		OP_9XY0();
		break;
	case 0xA000u:
		OP_ANNN();
		break;
	case 0xB000u:
		OP_BNNN();
		break;
	case 0xC000u:
		OP_CXNN();
		break;
	case 0xD000u:
		OP_DXYN();
		break;
	case 0xE000u:
		switch (opcode & 0x00FFu)
		{
		case 0x009Eu:
			OP_EX9E();
			break;
		case 0x00A1u:
			OP_EXA1();
			break;
		default:
			std::cerr << "Invalid opcode: 0x" << std::hex << opcode << std::endl;
			break;
		}
		break;
	case 0xF000u:
		switch (opcode & 0x00FFu)
		{
		case 0x0007u:
			OP_FX07();
			break;
		case 0x000Au:
			OP_FX0A();
			break;
		case 0x0015u:
			OP_FX15();
			break;
		case 0x0018u:
			OP_FX18();
			break;
		case 0x001Eu:
			OP_FX1E();
			break;
		case 0x0029u:
			OP_FX29();
			break;
		case 0x0033u:
			OP_FX33();
			break;
		case 0x0055u:
			OP_FX55();
			break;
		case 0x0065u:
			OP_FX65();
			break;
		default:
			std::cerr << "Invalid opcode: 0x" << std::hex << opcode << std::endl;
			break;
		}
		break;
	default:
		std::cerr << "Invalid opcode: 0x" << std::hex << opcode << std::endl;
		break;
	}

	// Update timers
	if (delayTimer > 0)
	{
		--delayTimer;
	}
	if (soundTimer > 0)
	{
		--soundTimer;
	}

}

```
1. ****{{< colour color="#FEFE54" >}}Fetching{{< /colour>}}****:
As mentioned earlier, in the CHIP-8 architecture, each opcode is 2 bytes (16 bits), and it's stored in memory starting at the program counter (pc). We combine the two bytes to form the complete opcode using bitwise shift and OR operations.

1. ****{{< colour color="#FEFE54" >}}Decoding & Executing{{< /colour>}}****:
Here, we're using a switch statement to decode and execute the opcode. The opcode's first nibble (4 bits) specifies the type of instruction. Each case within the switch corresponds to a range of opcode values. Depending on the opcode's type, you would call the respective function that implements that opcode's behavior.

> ##### Note:
> My choice of using a switch statement to decode an opcode is the easiest way to go, though it gets messy with many instructions, in our case (CHIP-8), this isn't so bad!
>

#### The Window Layer
We've successfully constructed our emulator, and now we're ready to see it in action. The window layer is essentially our bridge to visualize and interact with the emulator. I've chosen {{< coloredLink url="https://www.glfw.org/" color="#FEFE54" >}}GLFW{{< /coloredLink >}} alongside OpenGL to render our emulator's display content and manage input events. The reason for this choice boils down to GLFW's efficient handling of windows and its high compatibility with OpenGL. Before proceeding, please take note: I won't delve deep into how OpenGL operates. If you're new to this, and OpenGL seems overwhelming, consider starting with SDL; it's a more straightforward graphics handling library. I'll also use {{< coloredLink url="https://github.com/ocornut/imgui/tree/docking" color="#FEFE54" >}}ImGui{{< /coloredLink >}} for the Chip-8 Debugger, which allow us to monitor the inner workings of the CHIP-8 system, including its 16 registers, program counter, stack pointer, stack levels, and the index register.

```cpp
#include "Window.h"

const char* vertexShaderSource = R"glsl(
    #version 330 core
    layout(location = 0) in vec2 position;
    layout(location = 1) in vec2 texCoords;
    out vec2 TexCoords;
    
    void main()
    {
        gl_Position = vec4(position, 0.0f, 1.0f);
        TexCoords = texCoords;
    }
)glsl";

const char* fragmentShaderSource = R"glsl(
    #version 330 core
    in vec2 TexCoords;
    out vec4 color;
    
    uniform sampler2D displayTexture;
    
    void main()
    {
        color = texture(displayTexture, TexCoords);
    }
)glsl";

Window::Window(int width, int height, const std::string& title, Chip8* chip8Emulator)
	: m_Window(nullptr), myChip8(chip8Emulator), m_Width(width), m_Height(height), vSynch(0)
{
	if (!glfwInit()) {
		std::cerr << "Error while initializing GLFW" << std::endl;
		return;
	}

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, true);
	glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);

	m_Window = glfwCreateWindow(width, height, title.c_str(), nullptr, nullptr);
	if (!m_Window) {
		std::cerr << "Error while creating GLFW window" << std::endl;
		return;
	}
	std::cout << "Window Created" << std::endl;

	glfwMakeContextCurrent(m_Window);

	if (!gladLoadGL())
	{
		std::cerr << "Error while initializing GLAD" << std::endl;
		return;
	}
	const char* glVersion = reinterpret_cast<const char*>(glGetString(GL_VERSION));
	std::cerr << "OpenGL Version: {" << glVersion << "}" << std::endl;

	vSynch = 1;
	glfwSwapInterval(vSynch);
	if (vSynch == 1)
	{
		std::cout << "VSynch is enabled!" << std::endl;
	}
	else
		std::cout << "VSynch is not enabled!" << std::endl;

	initOpenGL();
	initializeImGui();

	glfwSetWindowUserPointer(m_Window, this);
	glfwSetFramebufferSizeCallback(m_Window, framebufferSizeCallback);
	glfwSetKeyCallback(m_Window, keyCallback);
}

Window::~Window()
{
	shutdownImGui();
	glDeleteVertexArrays(1, &VAO);
	glDeleteBuffers(1, &VBO);
	glDeleteTextures(1, &textureID);
	glDeleteShader(vertexShader);
	glDeleteShader(fragmentShader);
	glDeleteProgram(shaderProgram);
	glfwDestroyWindow(m_Window);
	glfwTerminate();
}

void Window::update()
{
	glfwPollEvents();
	glfwSwapBuffers(m_Window);
}

void Window::clear() const
{
	glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
}

bool Window::shouldClose() const
{
	return glfwWindowShouldClose(m_Window);
}

int Window::getWidth() const
{
	return m_Width;
}

int Window::getHeight() const
{
	return m_Height;
}

void Window::initOpenGL()
{
	float vertices[] = {
		// positions   // texture coords
		-1.0f,  1.0f,  0.0f, 1.0f,
		-1.0f, -1.0f,  0.0f, 0.0f,
		 1.0f, -1.0f,  1.0f, 0.0f,

		-1.0f,  1.0f,  0.0f, 1.0f,
		 1.0f, -1.0f,  1.0f, 0.0f,
		 1.0f,  1.0f,  1.0f, 1.0f
	};

	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glBindVertexArray(VAO);

	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
	glEnableVertexAttribArray(1);

	glBindBuffer(GL_ARRAY_BUFFER, 0);
	glBindVertexArray(0);

	// Texture for Chip-8 display
	glGenTextures(1, &textureID);
	glBindTexture(GL_TEXTURE_2D, textureID);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, DISPLAY_WIDTH, DISPLAY_HEIGHT, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glBindTexture(GL_TEXTURE_2D, 0);

	vertexShader = compileShader(vertexShaderSource, GL_VERTEX_SHADER);
	fragmentShader = compileShader(fragmentShaderSource, GL_FRAGMENT_SHADER);
	shaderProgram = glCreateProgram();
	linkProgram(shaderProgram, vertexShader, fragmentShader);

	glUseProgram(shaderProgram);

	glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
}

GLuint Window::compileShader(const char* source, GLenum type)
{
	GLuint shader = glCreateShader(type);
	glShaderSource(shader, 1, &source, nullptr);
	glCompileShader(shader);

	GLint success;
	glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
	if (!success)
	{
		char infoLog[512];
		glGetShaderInfoLog(shader, 512, nullptr, infoLog);
		std::cerr << "Shader Compilation Error\n" << infoLog << std::endl;
	}

	return shader;
}

void Window::linkProgram(GLuint program, GLuint vertexShader, GLuint fragmentShader)
{
	glAttachShader(program, vertexShader);
	glAttachShader(program, fragmentShader);

	glLinkProgram(program);
	GLint success;
	glGetProgramiv(program, GL_LINK_STATUS, &success);
	if (!success)
	{
		char infoLog[512];
		glGetProgramInfoLog(program, 512, nullptr, infoLog);

		std::cerr << "Program Linking Error\n" << infoLog << std::endl;
	}
}

void Window::initializeImGui() const
{
	IMGUI_CHECKVERSION();
	ImGui::CreateContext();
	ImGuiIO& io = ImGui::GetIO(); (void)io;
	ImGui::StyleColorsDark();

	ImGui_ImplGlfw_InitForOpenGL(m_Window, true);

	const char* glsl_version = "#version 330";
	ImGui_ImplOpenGL3_Init(glsl_version);

	ImGui::GetIO().ConfigFlags |= ImGuiConfigFlags_DockingEnable;
}

void Window::renderImGui() const
{
	ImGui_ImplOpenGL3_NewFrame();
	ImGui_ImplGlfw_NewFrame();
	ImGui::NewFrame();

	ImGui::DockSpaceOverViewport(nullptr, ImGuiDockNodeFlags_NoResize | ImGuiDockNodeFlags_PassthruCentralNode);

	// For the debugger
	float windowWidth = 300.0f;
	float windowHeight = 700.0f;

	ImGui::SetNextWindowSize(ImVec2(windowWidth, windowHeight), ImGuiCond_FirstUseEver);

	ImGui::SetNextWindowDockID(ImGui::GetID("CHIP-8 Debugger"), ImGuiCond_FirstUseEver);
	ImGui::Begin("CHIP-8 Debugger", nullptr, ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize);

	ImGui::Text("Display Frequency: %.1f Hz", ImGui::GetIO().DisplayFramebufferScale.x * glfwGetVideoMode(glfwGetPrimaryMonitor())->refreshRate);

	bool vsyncEnabled = vSynch ? true : false;
	ImGui::Text("VSynch: %s", vsyncEnabled ? "On" : "Off");

	ImGui::Text("Frame Time: %.2f ms", 1000.0f / ImGui::GetIO().Framerate);
	ImGui::Text("Delta Time: %.6f ms", ImGui::GetIO().DeltaTime * 1000.0f);

	ImGui::Text("Current Opcode: 0x%04X", myChip8->opcode);

	ImGui::Text("Registers:");
	for (int i = 0; i < 16; ++i) {
		ImGui::Text("V%X: 0x%02X", i, myChip8->registers[i]);
	}
	ImGui::Text("Index Register (I): 0x%04X", myChip8->indexRegister);

	ImGui::Text("Stack Levels:");
	for (int i = 0; i < 16; ++i) {
		ImGui::Text("Stack[%d]: 0x%04X", i, myChip8->stack[i]);
	}

	ImGui::Text("Stack Pointer (SP): 0x%02X", myChip8->sp);
	ImGui::Text("Program Counter (PC): 0x%04X", myChip8->pc);

	ImGui::End();

	ImGui::Render();
	ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
}

void Window::shutdownImGui() const
{
	ImGui_ImplOpenGL3_Shutdown();
	ImGui_ImplGlfw_Shutdown();
	ImGui::DestroyContext();
}

void Window::framebufferSizeCallback(GLFWwindow* window, int width, int height)
{
	glViewport(0, 0, width - 300.0f, height);
}

void Window::keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
	Window* winInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));
	if (!winInstance || !winInstance->myChip8) return;

	if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);

	if (action == GLFW_PRESS || action == GLFW_RELEASE)
	{
		bool isPressed = (action == GLFW_PRESS);

		switch (key)
		{
		case GLFW_KEY_3: winInstance->myChip8->keypad[1] = isPressed; break;
		case GLFW_KEY_4: winInstance->myChip8->keypad[2] = isPressed; break;
		case GLFW_KEY_5: winInstance->myChip8->keypad[3] = isPressed; break;
		case GLFW_KEY_6: winInstance->myChip8->keypad[0xC] = isPressed; break;

		case GLFW_KEY_E: winInstance->myChip8->keypad[4] = isPressed; break;
		case GLFW_KEY_R: winInstance->myChip8->keypad[5] = isPressed; break;
		case GLFW_KEY_T: winInstance->myChip8->keypad[6] = isPressed; break;
		case GLFW_KEY_Y: winInstance->myChip8->keypad[0xD] = isPressed; break;

		case GLFW_KEY_D: winInstance->myChip8->keypad[7] = isPressed; break;
		case GLFW_KEY_F: winInstance->myChip8->keypad[8] = isPressed; break;
		case GLFW_KEY_G: winInstance->myChip8->keypad[9] = isPressed; break;
		case GLFW_KEY_H: winInstance->myChip8->keypad[0xE] = isPressed; break;

		case GLFW_KEY_C: winInstance->myChip8->keypad[0xA] = isPressed; break;
		case GLFW_KEY_V: winInstance->myChip8->keypad[0] = isPressed; break;
		case GLFW_KEY_B: winInstance->myChip8->keypad[0xB] = isPressed; break;
		case GLFW_KEY_N: winInstance->myChip8->keypad[0xF] = isPressed; break;

		default: break;
		}
	}
}
```
Consult {{< coloredLink url="https://www.glfw.org/documentation" color="#FEFE54" >}}GLFW Documentation{{< /coloredLink >}}, {{< coloredLink url="https://github.com/ocornut/imgui/tree/master/examples" color="#FEFE54" >}}ImGui Examples{{< /coloredLink >}}, and the best of all time {{< coloredLink url="https://docs.gl/" color="#FEFE54" >}}OpenGL Docs{{< /coloredLink >}} for more specific information.

#### The Main Loop
Finally, our main loop orchestrates the calling of ****{{< colour color="#FEFE54" >}}Chip8::emulateCycle(){{< /colour>}}****. It makes use of the window layer to handle input events, providing interaction with the emulator, and to render.

I'll be utilizing three command-line arguments. Using command-line arguments allows us to configure and customize how the emulator behaves each time you run it, without needing to edit the emulator's code. It's a way to provide input parameters, like in our case we have three:

1. **{{< colour color="#FEFE54" >}}Video Scale{{< /colour >}}**: Allows to adjust the visual size of the emulator's display. By specifying a scale factor, we can control the dimensions of the virtual CHIP-8 screen. Given that I'm using a 300x700 ImGui window debugger for tracking CHIP-8 components like the stack, registers, pc, etc. I recommend using a scale factor above 20.
2. **{{< colour color="#FEFE54" >}}Cycle Rate{{< /colour >}}**: Crucial for regulating the emulation speed. By setting an appropriate rate value, we can control how quickly the emulator progresses through each cycle, simulating the original CHIP-8 hardware's execution speed. Typically, CHIP-8 has a cycle rate of 500.
3. **{{< colour color="#FEFE54" >}}ROM File{{< /colour >}}**: Which allows for loading different CHIP-8 programs into the emulator.

It goes something like that:
{{< highlight plaintext >}}
> Chip8.exe <Video Scale> <Cycle Rate> <ROM>
> Chip8.exe 25 300 Tetris.ch8
{{< /highlight >}}

Now jumping to our main.

```cpp
#include <chrono>

#include "Chip8.h"
#include "Window.h"

const int TIMER_RATE = 60;
const auto TIMER_PERIOD = std::chrono::microseconds(1000000 / TIMER_RATE);
const int  DISPLAY_SIZE = DISPLAY_WIDTH * DISPLAY_HEIGHT;

int main(int argc, char* argv[])
{
	if (argc != 4)
	{
		std::cerr << "Usage: " << argv[0] << " <Video Scale> <Cycle Rate> <ROM>\n";
		return 1;
	}

	int videoScale = std::atoi(argv[1]);
	int cycleRate = std::atoi(argv[2]);
	char const* romFilename = argv[3];

	const auto CHIP8_CYCLE_PERIOD = std::chrono::microseconds(1000000 / cycleRate);

	Chip8 myChip8;
	Window window(DISPLAY_WIDTH * videoScale, DISPLAY_HEIGHT * videoScale, "CHIP-8 Emulator", &myChip8);

	myChip8.loadROM(romFilename);

	auto lastCycleTime = std::chrono::high_resolution_clock::now();

	uint32_t* flippedDisplay = new uint32_t[DISPLAY_SIZE];

	auto lastTimerTime = lastCycleTime;
	const int texture = *(window.getTexture());
	const int vao = *(window.getVAO());

	while (!window.shouldClose())
	{
		auto now = std::chrono::high_resolution_clock::now();
		while (now - lastCycleTime > CHIP8_CYCLE_PERIOD)
		{
			myChip8.emulateCycle();
			lastCycleTime += CHIP8_CYCLE_PERIOD;
		}

		window.clear();
		glBindTexture(GL_TEXTURE_2D, texture);

		// Flipping the display vertically
		for (int y = 0; y < 32; y++)
		{
			for (int x = 0; x < 64; x++)
			{
				flippedDisplay[x + (31 - y) * 64] = myChip8.display[x + y * 64];
			}
		}

		glViewport(0, 0, DISPLAY_WIDTH * videoScale - 300.0f, DISPLAY_HEIGHT * videoScale);
		glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT, GL_RGBA, GL_UNSIGNED_BYTE, flippedDisplay);

		glBindVertexArray(vao);
		glDrawArrays(GL_TRIANGLES, 0, 6);
		glBindVertexArray(0);
		glBindTexture(GL_TEXTURE_2D, 0);

		window.renderImGui();
		window.update();
	}

	delete[] flippedDisplay;
	return 0;
}
```
With each iteration of the loop, the CHIP-8 emulator processes CPU operations according to the set cycle rate, employs OpenGL to display the graphics, and manages window events. The display is flipped vertically before passing to OpenGL for rendering, primarily because OpenGL's coordinate system originates from the bottom-left, whereas CHIP-8's display starts from the top-left. Command-line arguments define core settings like video scale and ROM selection, ensuring flexible initialization. For more details about the [{{< colour color="#FEFE54" >}}Window Layer{{< /colour >}}](#the-window-layer), refer to its dedicated section.

#### In Action!
Now it's time to test if our CPU is operating like we expect. Check this {{< coloredLink url="https://github.com/dmatlack/chip8/tree/master/roms" color="#FEFE54" >}}CHIP-8 Program Pack{{< /coloredLink >}} for ROMs.

{{< highlight plaintext >}}
> chip8 25 100 test_opcode.ch8 
{{< /highlight >}}

{{< figure src="/images/chip8-test_opcode.png" alt="Running test_opcode.ch8 on the CHIP-8 Emulator" width="800px" height="500px">}}

{{< video src="/videos/chip8-test_opcode.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

{{< highlight plaintext >}}
> chip8 25 300 cave.ch8 
{{< /highlight >}}

{{< video src="/videos/chip8-cave.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

This game is harder than it looks

{{< highlight plaintext >}}
> chip8 25 300 tetris.ch8 
{{< /highlight >}}

{{< video src="/videos/chip8-tetris.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

#### Conclusion
That's it, we've successfully built our very first emulator! Personally, I feel like this journey has deepened my understanding of low-level computer fundamentals -  knowledge I'll surely leverage in future programming adventures. I'm considering building an NES emulator next, or I might take the hardware route and craft a physical CHIP-8 machine, once I explore Verilog and FPGA :)

#### Source Code
You can find all the code {{< coloredLink url="https://github.com/Saeb0x/CHIP8-Emulator" color="#FEFE54" >}}here{{< /coloredLink >}}.
***
Last Edited: May 24, 2026