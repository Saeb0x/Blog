---
title: "CHIP-8 Emulator"
date: 2023-08-09
description: "Building a CHIP-8 interpreter and emulator from scratch in C++, covering opcodes, display, timers, and input handling."
draft: false
---
Lately, I've been looking for a side project to work on outside my daytime internship. I've always loved emulators for their ability to bring back old retro games, so I figured it would be interesting to understand how emulators work and even try my hand at building one!

After doing some research, I found that most experienced emulator developers, who take emulation programming seriously, advise beginners to start with something simple, like the CHIP-8, instead of diving directly into NES or Game Boy emulation :)

1. [{{< colour >}}CHIP-8{{< /colour >}}](#chip-8) 
2. [{{< colour >}}What is Emulation & What is an Emulator?{{< /colour >}}](#what-is-emulation--what-is-an-emulator)
3. [{{< colour >}}The Hardware{{< /colour >}}](#the-hardware)
4. [{{< colour >}}Class Members{{< /colour >}}](#class-members)
5. [{{< colour >}}The Instructions{{< /colour >}}](#the-instructions)
6. [{{< colour >}}Fetching, Decoding, and Executing opcodes{{< /colour >}}](#fetching-decoding-and-executing-opcodes)
7. [{{< colour >}}The Window Layer{{< /colour >}}](#the-window-layer)
8. [{{< colour >}}The Main Loop{{< /colour >}}](#the-main-loop)
9. [{{< colour >}}In Action!{{< /colour >}}](#in-action)	
10. [{{< colour >}}Conclusion{{< /colour >}}](#conclusion)
11. [{{< colour >}}Source Code{{< /colour >}}](#source-code)

#### CHIP-8
The CHIP-8 was not a physical machine; rather, it was a virtual machine designed for early microcomputers. It functioned as an interpreted programming language, where programmers could write programs using a specific set of instructions. These programs were intended to be executed by a CHIP-8 interpreter, which would decode the instructions and execute them on the target machine.

Since the CHIP-8 was a virtual machine, the same programs written for it could be executed on different machines as long as they had an interpreter specifically designed to interpret CHIP-8 instructions. This portability was one of the advantages of using a virtual machine.

My plan is to create an emulator that simulates the behavior of a CHIP-8 interpreter. The emulator will read and interpret CHIP-8 programs, executing the corresponding instructions, and simulating the virtual machine's behavior. By doing so, we'll be able to run existing CHIP-8 programs on our emulator, just as they would have run on a physical machine with a CHIP-8 interpreter.

While strictly speaking, what we're building is an interpreter for the CHIP-8 virtual machine, it's common to refer to this kind of project as an "emulator" since it emulates the behavior of the virtual machine on modern hardware. Let me now list a few reasons why I personally believe it is an excellent fit for beginners:

1. **{{< colour >}}Simplicity{{< /colour >}}**: CHIP-8 has a simple architecture with a limited set of opcodes (only 35).

2. **{{< colour >}}Educational Value{{< /colour >}}**: You'll learn about CPU instruction decoding, memory management, and other essential emulator components that are applicable to more advanced emulators.

3. **{{< colour >}}Abundance of Resources{{< /colour >}}**: CHIP-8 is a well-known and widely documented system, and there are numerous tutorials, articles, and open-source implementations available online.

4. **{{< colour >}}Retro Appeal (my favorite){{< /colour >}}**: You'll have the chance to revive classic retro games and experience computing history firsthand.

#### What is Emulation & What is an Emulator?
When it comes to explaining emulation, some people tend to go into a lot of technical details, but I prefer to think of it simply as replicating hardware in software. Essentially, it's about creating software that mimics the functionality and behavior of the emulated system. Emulators are designed to read the original machine code instructions (opcodes) that were initially created for the target machine, which is the system being emulated. These opcodes represent the low-level instructions that the original hardware of the target machine can understand and execute.

> ##### Note:
> When dealing with older gaming consoles or computer systems, the software and games were often distributed and stored on ROM (Read-Only Memory) files or cartridges. These files contain the binary data representing the original machine code instructions for the target system. In the context of emulation, ROM files and cartridges act as the source material that the emulator needs to read and interpret.
>

#### The Hardware 
Now that we have an idea of how emulators work, we'd like to mimic the components of a CHIP-8. Let's talk about them:

1. **{{< colour >}}Sixteen 8-bit registers (V0-VF){{< /colour >}}**: 

Registers are small, fast dedicated locations on a CPU for storage. The CPU uses these registers to hold data temporarily during its operations. Since registers are located within the CPU itself, accessing data from registers is faster than retrieving data from main memory (RAM). But a CPU typically only has a few registers, so long-term data is held in memory instead. CPU operations often involve loading data from memory into registers, performing operations on these registers (such as arithmetic or logical operations), and storing the results back into memory.

In the CHIP-8, there are sixteen 8-bit registers, which are identified by the labels V0 to VF. Each register can hold a value ranging from 0x00 to 0xFF (0 to 255 in decimal). Being 8-bit, the registers can represent values in the range of a single byte (2^8 = 256).

The V0 to VE registers are general-purpose registers. The VF register, however, is often used as a flag that holds information about the result of an operation, acting as a carry or borrow indicator. It is special because certain arithmetic and logical operations update VF with specific information. For example, if an addition operation between two values results in a carry (a value greater than 255 in 8-bit arithmetic), the VF register is set to 1, indicating a carry. Similarly, if a subtraction operation results in a borrow (a negative result), the VF register may be set to 0 to indicate a borrow.

2. **{{< colour >}}Memory of 0x1000 (4K or 4096) bytes{{< /colour >}}**: 

Because of the relatively little register-space, a computer needs a large chunk of general memory to hold long-term data, short-term data, and program instructions. Different locations in memory are referenced using an address.

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
- The first 0x200 (512) bytes, from 0x000-0x1FF, are reserved for the CHIP-8 interpreter itself. As a result, these memory locations should not be used by the programs written in the CHIP-8 language.
- 0x200-0xFFF: Most CHIP-8 programs (Instructions from the ROM) start at location 0x200.

> ##### Note:
> There's a storage space (80 bytes in total) from 0x050-0x0A0 dedicated for the 16 built-in characters (0 through F), which we will need to manually put into our memory because ROMs (or CHIP-8 programs) will be looking for those characters to display text or symbols. Each character occupies 5 bytes of memory.
>

3. **{{< colour >}}16-bit Index Register (I){{< /colour >}}**:

The index register serves as a memory pointer or memory address register; it holds a memory address that points to a specific location in memory. When a CHIP-8 program needs to access data from or store data to a particular memory location, it can use the index register to specify that memory address. Using a 16-bit index register in CHIP-8 allows it to address the entire 4KB memory space (65,536 locations), whereas an 8-bit index register would be limited to 256 locations, insufficient for the full memory coverage.

4. **{{< colour >}}16-bit Program Counter (PC){{< /colour >}}**:

The Program Counter plays a central role in executing programs; it is a special register that keeps track of the memory address of the next instruction to be fetched and executed by the CPU.

> ##### Note:
> In the CHIP-8 system, each instruction is represented by a 2-byte opcode, but memory addresses are single bytes. To fetch an instruction, we read a byte from the memory address pointed to by the program counter (PC) and another byte from PC+1, then combine them to form the full opcode. **{{< colour >}}After fetching, we increment the PC by 2 before executing instructions{{< /colour >}}** because some instructions modify the PC to control the program flow, either adding, subtracting, or completely changing its value.
>

5. **{{< colour >}}16-level Stack{{< /colour >}}**:

The stack is a fundamental component used for managing the program's execution flow. In simple terms, the stack is like a temporary storage area that helps the CPU remember where it was in the program before it jumps to another part of the program. For example, when the CPU encounters a "CALL" instruction, it needs to remember the memory address of the next instruction after the call. To do this, it **{{< colour >}}puts{{< /colour >}}** that memory address (the value of the program counter, PC) onto the stack. After executing a subroutine or function called by the "CALL" instruction, the CPU needs to go back to where it was in the main program. The "RETURN" (RET) instruction does this by **{{< colour >}}pulling{{< /colour >}}** the memory address (the value) from the top of the stack and setting the program counter (PC) to that value. This allows the CPU to continue executing the main program from where it left off.

The CHIP-8 stack can remember up to 16 different memory addresses (levels). This allows for nested function calls, meaning one function can call another function, and so on, until they all return to their original calling points. The process of putting a memory address onto the stack is called "pushing", and the process of taking a memory address off the stack is called "popping".

6. **{{< colour >}}8-bit Stack Pointer (SP){{< /colour >}}**:

This guy right here is the manager of the stack. The stack pointer is used to keep track of the current level of the stack, indicating the next available position in memory to push data onto the stack or pop data from it.

The stack in a CHIP-8 emulator can be represented as an array, making the 8-bit stack pointer function as an index to manage the stack's 16 levels efficiently (0-15). When popping a value, the stack pointer decrements to the previous position, copying the value instead of deleting it. Deleting data from an array (the stack) would require additional operations to shift the remaining elements down in the memory to fill the gap left by the deleted value.

7. **{{< colour >}}8-bit Delay Timer & 8-bit Sound Timer{{< /colour >}}**:

The CHIP-8 includes two timers: the Delay Timer and the Sound Timer. Both timers are 8-bit registers that count down at a rate of 60Hz, which means they decrease their value 60 times per second.

- Delay Timer: Used for timing. If the timer value is zero, it stays zero. If it is loaded with a value, it will decrement at a rate of 60Hz (60 times per second).
- Sound Timer: Same behavior, but used for simple sound emission.

8. **{{< colour >}}16 input built-in characters "keys"{{< /colour >}}**:

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

9. **{{< colour >}}64x32-pixel Monochrome Display{{< /colour >}}**:

It consists of a 64x32 monochrome pixel grid, meaning it has 64 columns and 32 rows of pixels. The pixels can only be in an "on" or "off" state, giving the display a simple black-and-white appearance. The CHIP-8 display operates with a single bit per pixel, where a "1" represents an "on" or lit pixel, and a "0" represents an "off" or unlit pixel.

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
#include <array>
#include <cstdint>

class Chip8
{
public:
	static constexpr uint32_t DisplayWidth = 64;
	static constexpr uint32_t DisplayHeight = 32;

private:
	static constexpr uint32_t MemorySize = 0x1000;
	static constexpr uint32_t ProgramStartAddress = 0x200;
	static constexpr uint32_t FontsetStartAddress = 0x050;

private:
	std::array<uint8_t, 16> m_Registers{};
	std::array<uint8_t, MemorySize> m_Memory{};
	uint16_t m_IndexRegister{};
	uint16_t m_PC{};
	std::array<uint16_t, 16> m_Stack{};
	uint8_t m_SP{};
	uint16_t m_Opcode{};
	uint8_t m_DelayTimer{};
	uint8_t m_SoundTimer{};
	std::array<uint8_t, 16> m_Keypad{};
	std::array<uint32_t, DisplayWidth * DisplayHeight> m_Display{};
};

```

Firstly, let's handle loading the CHIP-8 program, we need to load the contents of a ROM file so that we can have all the instructions in memory before we can execute them.

```cpp
#include <fstream>
#include <iostream>

void Chip8::LoadROM(const char* romFileName)
{
	std::ifstream file(romFileName, std::ios::binary);

	if (!file)
	{
		std::cerr << "Error: Failed to open ROM file." << std::endl;
		return;
	}

	file.seekg(0, std::ios::end);
	std::streampos fileSize = file.tellg();

	if (fileSize > MemorySize - ProgramStartAddress)
	{
		std::cerr << "Error: ROM size exceeds available memory." << std::endl;
		return;
	}

	file.seekg(0, std::ios::beg);
	file.read(reinterpret_cast<char*>(m_Memory.data() + ProgramStartAddress), fileSize);

	file.close();
	std::cout << "Successfully loaded ROM: " << romFileName << std::endl;
}
```

As mentioned earlier, the first 0x200 (512) bytes of the CHIP-8's memory are reserved for the interpreter, so the ROM instructions must start at 0x200.

Now that the starting address is known and decided, we can assign it to the program counter in the constructor!

```cpp
Chip8::Chip8()
{
	m_PC = ProgramStartAddress;
}
```
I mentioned earlier that there are 16 built-in characters (0 through F) we need to manually put into our memory because ROMs (or CHIP-8 programs) will be looking for those characters to display text or symbols. Each character is 5 bytes long, and we can store these fonts directly in memory starting at address 0x050.

```cpp
namespace
{
	// Font data for the 16 built-in characters (0-F), each is 5 bytes long.
	constexpr std::array<uint8_t, 16 * 5> FontSet = {
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
}

Chip8::Chip8()
{
	m_PC = ProgramStartAddress;

	// Load the fonts into memory starting at address 0x050 to 0x0A0 (80 bytes).
	for (uint32_t i = 0; i < static_cast<uint32_t>(FontSet.size()); ++i)
	{
		m_Memory[FontsetStartAddress + i] = FontSet[i];
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

The sprite represents the number "1" correctly. The "on" pixels (1s) are where the number "1" is drawn, and the "off" pixels (0s) are where the background is left empty. If you can't see it properly, {{< coloredLink url="https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Technical-Reference#fonts" >}}check this{{< /coloredLink >}}.

#### The Instructions
The CHIP-8 has {{< coloredLink url="https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Instruction-Set" >}}35 instructions{{< /coloredLink >}}, though we'll only implement 34 of them below.
*****

****{{< colour >}}00E0 - Clear the screen{{< /colour>}}****

We emulate this by setting the entire display buffer to zeros.

```cpp
void Chip8::Op00E0()
{
	m_Display.fill(0);
}
```

****{{< colour >}}00EE - Return from a subroutine (RET){{< /colour>}}****

Subroutines are sections of code that can be called and later returned from. Let me break down the emulation of this:

1. When you call a subroutine using the CALL instruction, the address of the next instruction after the CALL is saved on the stack.

2. The 00EE instruction is used to return from that subroutine. It does this by:
- Taking the address from the top of the stack (the one that was saved during the CALL).
- Moving the stack pointer down to the previous level on the stack.
- Setting the program counter (PC) to the retrieved address.
```cpp
void Chip8::Op00EE()
{
	--m_SP;
	m_PC = m_Stack[m_SP];
}
```
****{{< colour >}}1NNN - Jump (JMP) to address NNN{{< /colour>}}****

For the jump instruction, no stack interaction is required. We just set the program counter to the address NNN. '1' here is the opcode for the jump instruction, and 'NNN' represents the address. We'll need to extract the address NNN from the opcode.

```cpp
void Chip8::Op1NNN()
{
	uint16_t address = m_Opcode & 0x0FFFu;
	m_PC = address;
}
```
We use a bitwise AND operation (opcode & 0x0FFF) to extract the lower 12 bits (NNN) of the instruction.

{{< highlight plaintext >}}
Opcode: 0001 NNNN NNNN NNNN
Mask:   0000 1111 1111 1111
Result: 0000 NNNN NNNN NNNN
{{< /highlight >}}

****{{< colour >}}2NNN - Execute subroutine starting at address NNN{{< /colour>}}****

We extract the lower 12 bits (NNN) from the opcode using a bitwise AND operation. The current program counter (PC) is saved onto the stack, enabling a return point, and the stack pointer (SP) is incremented. Then, the program counter is updated to the specified subroutine address, effectively branching to a new section of code.

```cpp
void Chip8::Op2NNN()
{
	uint16_t address = m_Opcode & 0x0FFFu;

	m_Stack[m_SP] = m_PC;
	++m_SP;
	m_PC = address;
}
```
****{{< colour >}}3XNN - Skip the following instruction if the value of register VX equals NN{{< /colour>}}****

First, we extract the register index X from the opcode. The opcode is shifted right by 8 bits to get the bits corresponding to X, and then masked with 0x000F to ensure we only get the lowest 4 bits. Then we extract the constant value NN from the opcode by masking it with 0x00FF to get the lowest 8 bits. If they're equal, we skip the next instruction by increasing the PC by 2. **{{< colour >}}Remember{{< /colour>}}** that our PC has already been incremented by 2 in **{{< colour >}}EmulateCycle(){{< /colour>}}**, we just increment by 2 again to skip the next instruction.

```cpp
void Chip8::Op3XNN()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x000Fu;
	uint8_t valueNN = m_Opcode & 0x00FFu;

	if (m_Registers[VX] == valueNN)
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}4XNN - Skip the following instruction if the value of register VX is not equal to NN{{< /colour>}}****

```cpp
void Chip8::Op4XNN()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x000Fu;
	uint8_t valueNN = m_Opcode & 0x00FFu;

	if (m_Registers[VX] != valueNN)
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}5XY0 - Skip the following instruction if the value of register VX is equal to the value of register VY{{< /colour>}}****

```cpp
void Chip8::Op5XY0()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	if (m_Registers[VX] == m_Registers[VY])
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}6XNN - Store number NN in register VX{{< /colour>}}****

```cpp
void Chip8::Op6XNN()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t valueNN = m_Opcode & 0x00FFu;

	m_Registers[VX] = valueNN;
}
```
****{{< colour >}}7XNN - Add the value NN to register VX{{< /colour>}}****
```cpp
void Chip8::Op7XNN()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t valueNN = m_Opcode & 0x00FFu;

	m_Registers[VX] += valueNN;
}
```
****{{< colour >}}8XY0 - Store the value of register VY in register VX{{< /colour>}}****

```cpp
void Chip8::Op8XY0()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[VX] = m_Registers[VY];
}
```

****{{< colour >}}8XY1 - Set VX to VX OR VY{{< /colour>}}****

```cpp
void Chip8::Op8XY1()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[VX] |= m_Registers[VY];
}
```
****{{< colour >}}8XY2 - Set VX to VX AND VY{{< /colour>}}****

```cpp
void Chip8::Op8XY2()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[VX] &= m_Registers[VY];
}
```
****{{< colour >}}8XY3 - Set VX to VX XOR VY{{< /colour>}}****
```cpp
void Chip8::Op8XY3()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[VX] ^= m_Registers[VY];
}
```
****{{< colour >}}8XY4 - Add the value of register VY to register VX, Set VF to 01 if a carry occurs or 00 if a carry does not occur{{< /colour>}}****

We add the value of register VY to register VX. If the result is greater than 8 bits (i.e., greater than 255), set the carry flag (VF) to 1, otherwise set it to 0. Store the result in register VX.

```cpp
void Chip8::Op8XY4()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	uint16_t sum = m_Registers[VX] + m_Registers[VY];

	m_Registers[0xF] = (sum > 255) ? 1 : 0;

	m_Registers[VX] = sum & 0xFFu;
}
```
****{{< colour >}}8XY5 - Subtract the value of register VY from register VX, Set VF to 00 if a borrow occurs or 01 if a borrow does not occur{{< /colour>}}****

```cpp
void Chip8::Op8XY5()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[0xF] = (m_Registers[VX] >= m_Registers[VY]) ? 1 : 0;

	m_Registers[VX] -= m_Registers[VY];
}

```

****{{< colour >}}8XY6 - Shift Right and Store LSB{{< /colour>}}****

We need to store the value of register VY shifted right one bit (divided by 2) in register VX, and set register VF to the least significant bit prior to the shift.

```cpp
void Chip8::Op8XY6()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	m_Registers[0xF] = m_Registers[VY] & 0x1u;

	m_Registers[VX] = m_Registers[VY] >> 1;
}
```

****{{< colour >}}8XY7 - Set register VX to the value of VY minus VX, Set VF to 00 if a borrow occurs or 01 if a borrow does not occur{{< /colour>}}****

```cpp
void Chip8::Op8XY7()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	if (m_Registers[VY] > m_Registers[VX])
	{
		m_Registers[0xF] = 1;
	}
	else
	{
		m_Registers[0xF] = 0;
	}

	m_Registers[VX] = m_Registers[VY] - m_Registers[VX];
}
```

****{{< colour >}}8XYE - Bitwise Shift Left with Carry{{< /colour>}}****
```cpp
void Chip8::Op8XYE()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	m_Registers[0xF] = (m_Registers[VX] >> 7u) & 0x1u;

	m_Registers[VX] <<= 1;
}
```
****{{< colour >}}9XY0 - Skip the following instruction if the value of register VX is not equal to the value of register VY{{< /colour>}}****

```cpp
void Chip8::Op9XY0()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t VY = (m_Opcode >> 4u) & 0x0Fu;

	if (m_Registers[VX] != m_Registers[VY])
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}ANNN - Store memory address NNN in register I (Index Register){{< /colour>}}****
```cpp
void Chip8::OpANNN()
{
	uint16_t address = m_Opcode & 0x0FFFu;

	m_IndexRegister = address;
}
```
****{{< colour >}}BNNN - Jump to address NNN + V0{{< /colour>}}****
```cpp
void Chip8::OpBNNN()
{
	uint16_t address = m_Opcode & 0x0FFFu;

	m_PC = m_Registers[0x0] + address;
}
```
****{{< colour >}}CXNN - Set VX to a random number with a mask of NN{{< /colour>}}****
```cpp
void Chip8::OpCXNN()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t valueNN = m_Opcode & 0x00FFu;

	uint8_t randomValue = std::rand() & 0xFFu;

	m_Registers[VX] = randomValue & valueNN;
}
```
****{{< colour >}}DXYN - Drawing a sprite{{< /colour>}}****

Draw a sprite at coordinates (VX, VY) with a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read from memory at location I (index register). VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 otherwise.

```cpp
void Chip8::OpDXYN()
{
	uint8_t VX = m_Registers[(m_Opcode >> 8u) & 0x0Fu];
	uint8_t VY = m_Registers[(m_Opcode >> 4u) & 0x0Fu];
	uint8_t height = m_Opcode & 0x000Fu;

	m_Registers[0xF] = 0;

	for (uint8_t row = 0; row < height; ++row)
	{
		uint8_t spriteByte = m_Memory[m_IndexRegister + row];

		for (uint8_t col = 0; col < 8; ++col)
		{
			uint8_t spritePixel = spriteByte & (0x80u >> col);
			uint32_t* screenPixel = &m_Display[(VX + col) + (VY + row) * DisplayWidth];

			// Map the sprite pixel to the corresponding RGBA value.
			uint32_t rgbaSpritePixel = spritePixel ? 0xFFFFFFFF : 0x00000000;

			if (spritePixel && *screenPixel == 0xFFFFFFFF)
			{
				m_Registers[0xF] = 1;
			}

			*screenPixel ^= rgbaSpritePixel;
		}
	}
}
```
Mapping sprite pixels to RGBA values enables the monochromatic CHIP-8 display to be visualized on modern color screens (where RGBA representation is popular). This translation provides flexibility in representation and ensures compatibility with current display tech.

****{{< colour >}}EX9E - Skip the following instruction if the key corresponding to the hex value currently stored in register VX is pressed{{< /colour>}}****

```cpp
void Chip8::OpEX9E()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	if (m_Keypad[m_Registers[VX]])
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}EXA1 - Skip the following instruction if the key corresponding to the hex value currently stored in register VX is not pressed{{< /colour>}}****

```cpp
void Chip8::OpEXA1()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	if (!m_Keypad[m_Registers[VX]])
	{
		m_PC += 2;
	}
}
```
****{{< colour >}}FX07 - Store the current value of the delay timer in register VX{{< /colour>}}****

```cpp
void Chip8::OpFX07()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	m_Registers[VX] = m_DelayTimer;
}
```

****{{< colour >}}FX0A - Wait for a keypress and store the result in register VX{{< /colour>}}****

```cpp
void Chip8::OpFX0A()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	bool keyPressed = false;
	for (uint32_t i = 0; i < 16; ++i)
	{
		if (m_Keypad[i])
		{
			m_Registers[VX] = static_cast<uint8_t>(i);
			keyPressed = true;
			break;
		}

		// If no key is pressed, repeat the instruction to wait for a key press.
		if (!keyPressed)
		{
			m_PC -= 2;
		}
	}
}
```

****{{< colour >}}FX15 - Set the delay timer to the value of register VX{{< /colour>}}****

```cpp
void Chip8::OpFX15()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	m_DelayTimer = m_Registers[VX];
}
```

****{{< colour >}}FX18 - Set the sound timer to the value of register VX{{< /colour>}}****

```cpp
void Chip8::OpFX18()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	m_SoundTimer = m_Registers[VX];
}
```
****{{< colour >}}FX1E - Add the value stored in register VX to register I (index register){{< /colour>}}****

```cpp
void Chip8::OpFX1E()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	m_IndexRegister += m_Registers[VX];
}
```

****{{< colour >}}FX29 - Set register I to the memory address of the sprite data corresponding to the hexadecimal digit stored in register VX{{< /colour>}}****

This instruction is commonly used for drawing characters and symbols on the screen.
```cpp
void Chip8::OpFX29()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t digit = m_Registers[VX];

	m_IndexRegister = FontsetStartAddress + (5 * digit);
}
```
****{{< colour >}}FX33 - Store the binary-coded decimal (BCD) equivalent of the value stored in register VX at addresses I, I + 1, and I + 2{{< /colour>}}****

This instruction converts the decimal value stored in register VX into its binary-coded decimal (BCD) representation and stores it in memory starting at the memory address stored in the index register (I).

To achieve this, we need to extract the hundreds, tens, and ones digits from the value in register VX. This is done using division and modulo operations.

```cpp
void Chip8::OpFX33()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;
	uint8_t value = m_Registers[VX];

	uint8_t hundreds = value / 100;
	uint8_t tens = (value / 10) % 10;
	uint8_t ones = value % 10;

	// Store BCD representation in memory.
	m_Memory[m_IndexRegister] = hundreds;
	m_Memory[m_IndexRegister + 1] = tens;
	m_Memory[m_IndexRegister + 2] = ones;
}
```
Look at this example here:
{{< highlight plaintext >}}
Value in VX: 456
Hundreds: 456/100 = {4}
Tens: (456 / 10) % 10 = {5}
Ones: 456 % 10 = {6}
{{< /highlight >}}

****{{< colour >}}FX55 - Store the values of registers V0 to VX inclusive in memory starting at address I{{< /colour>}}****

This is used to store the values of registers V0 through VX (inclusive) into memory starting at the address pointed to by the index register (I).

```cpp
void Chip8::OpFX55()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	for (uint8_t i = 0; i <= VX; ++i)
	{
		m_Memory[m_IndexRegister + i] = m_Registers[i];
	}
}
```
****{{< colour >}}FX65 - Fill registers V0 to VX inclusive with the values stored in memory starting at address I{{< /colour>}}****

```cpp
void Chip8::OpFX65()
{
	uint8_t VX = (m_Opcode >> 8u) & 0x0Fu;

	for (uint8_t i = 0; i <= VX; ++i)
	{
		m_Registers[i] = m_Memory[m_IndexRegister + i];
	}
}
```

> ##### Note
> Some CHIP-8 implementations for the last two opcodes (FX55 and FX65) also increase the index register by the value of VX + 1 after executing these opcodes. This is a source of variation among different CHIP-8 implementations. The provided code does not include this behavior, so you may want to verify if it's required for a specific game or program you want to emulate!
>

****{{< colour >}}0NNN - Execute machine language subroutine at address NNN{{< /colour>}}****

I left the discussion of the 0NNN opcode until last since it's rarely implemented in modern emulators. Historically, it called a machine language subroutine on the original hardware, a capability that doesn't translate to modern systems, so it's typically treated as a no-op and skipped entirely. Its absence doesn't impact the functionality of modern CHIP-8 applications. As a result, I'll exclude its implementation!

#### Fetching, Decoding, and Executing opcodes

The ****{{< colour >}}EmulateCycle(){{< /colour>}}**** function fetches the opcode from memory, decodes it using a switch statement, executes the corresponding operation, and increments the program counter.

```cpp
void Chip8::EmulateCycle()
{
	// Fetch opcode.
	m_Opcode = m_Memory[m_PC] << 8u | m_Memory[m_PC + 1];

	// Increment the PC before executing anything.
	m_PC += 2;

	// Decode and execute opcode.
	switch (m_Opcode & 0xF000u)
	{
		case 0x0000u:
		{
			switch (m_Opcode & 0x000Fu)
			{
				case 0x0000u:
				{
					Op00E0();
					break;
				}
				case 0x000Eu:
				{
					Op00EE();
					break;
				}
				default:
				{
					std::cerr << "Invalid opcode: 0x" << std::hex << m_Opcode << std::endl;
					break;
				}
			}

			break;
		}
		case 0x1000u:
		{
			Op1NNN();
			break;
		}
		case 0x2000u:
		{
			Op2NNN();
			break;
		}
		case 0x3000u:
		{
			Op3XNN();
			break;
		}
		case 0x4000u:
		{
			Op4XNN();
			break;
		}
		case 0x5000u:
		{
			Op5XY0();
			break;
		}
		case 0x6000u:
		{
			Op6XNN();
			break;
		}
		case 0x7000u:
		{
			Op7XNN();
			break;
		}
		case 0x8000u:
		{
			switch (m_Opcode & 0x000Fu)
			{
				case 0x0000u:
				{
					Op8XY0();
					break;
				}
				case 0x0001u:
				{
					Op8XY1();
					break;
				}
				case 0x0002u:
				{
					Op8XY2();
					break;
				}
				case 0x0003u:
				{
					Op8XY3();
					break;
				}
				case 0x0004u:
				{
					Op8XY4();
					break;
				}
				case 0x0005u:
				{
					Op8XY5();
					break;
				}
				case 0x0006u:
				{
					Op8XY6();
					break;
				}
				case 0x0007u:
				{
					Op8XY7();
					break;
				}
				case 0x000Eu:
				{
					Op8XYE();
					break;
				}
				default:
				{
					std::cerr << "Invalid opcode: 0x" << std::hex << m_Opcode << std::endl;
					break;
				}
			}

			break;
		}
		case 0x9000u:
		{
			Op9XY0();
			break;
		}
		case 0xA000u:
		{
			OpANNN();
			break;
		}
		case 0xB000u:
		{
			OpBNNN();
			break;
		}
		case 0xC000u:
		{
			OpCXNN();
			break;
		}
		case 0xD000u:
		{
			OpDXYN();
			break;
		}
		case 0xE000u:
		{
			switch (m_Opcode & 0x00FFu)
			{
				case 0x009Eu:
				{
					OpEX9E();
					break;
				}
				case 0x00A1u:
				{
					OpEXA1();
					break;
				}
				default:
				{
					std::cerr << "Invalid opcode: 0x" << std::hex << m_Opcode << std::endl;
					break;
				}
			}

			break;
		}
		case 0xF000u:
		{
			switch (m_Opcode & 0x00FFu)
			{
				case 0x0007u:
				{
					OpFX07();
					break;
				}
				case 0x000Au:
				{
					OpFX0A();
					break;
				}
				case 0x0015u:
				{
					OpFX15();
					break;
				}
				case 0x0018u:
				{
					OpFX18();
					break;
				}
				case 0x001Eu:
				{
					OpFX1E();
					break;
				}
				case 0x0029u:
				{
					OpFX29();
					break;
				}
				case 0x0033u:
				{
					OpFX33();
					break;
				}
				case 0x0055u:
				{
					OpFX55();
					break;
				}
				case 0x0065u:
				{
					OpFX65();
					break;
				}
				default:
				{
					std::cerr << "Invalid opcode: 0x" << std::hex << m_Opcode << std::endl;
					break;
				}
			}

			break;
		}
		default:
		{
			std::cerr << "Invalid opcode: 0x" << std::hex << m_Opcode << std::endl;
			break;
		}
	}
}
```

Timers aren't updated in here anymore. The original version decremented them once per emulated CPU cycle, which ties their rate to whatever cycle rate you pass on the command line, that's wrong, since the CHIP-8's delay and sound timers are meant to tick down at a fixed 60Hz regardless of how fast instructions execute. `UpdateTimers()` now lives on its own and is driven by a separate 60Hz clock in the main loop:

```cpp
void Chip8::UpdateTimers()
{
	if (m_DelayTimer > 0)
	{
		--m_DelayTimer;
	}

	if (m_SoundTimer > 0)
	{
		--m_SoundTimer;
	}
}
```

1. ****{{< colour >}}Fetching{{< /colour>}}****:
As mentioned earlier, in the CHIP-8 architecture, each opcode is 2 bytes (16 bits), and it's stored in memory starting at the program counter (PC). We combine the two bytes to form the complete opcode using bitwise shift and OR operations.

1. ****{{< colour >}}Decoding & Executing{{< /colour>}}****:
Here, we're using a switch statement to decode and execute the opcode. The opcode's first nibble (4 bits) specifies the type of instruction. Each case within the switch corresponds to a range of opcode values. Depending on the opcode's type, you would call the respective function that implements that opcode's behavior.

> ##### Note:
> My choice of using a switch statement to decode an opcode is the easiest way to go, though it gets messy with many instructions, in our case (CHIP-8), this isn't so bad!
>

#### The Window Layer
I've chosen {{< coloredLink url="https://www.glfw.org/" >}}GLFW{{< /coloredLink >}} alongside OpenGL to render our emulator's display content and manage input events. Before proceeding, please take note: I won't delve deep into how OpenGL operates. If you're new to this, and OpenGL seems overwhelming, consider starting with SDL; it's more straightforward. I'll also use {{< coloredLink url="https://github.com/ocornut/imgui/tree/docking" >}}ImGui{{< /coloredLink >}} for the Chip-8 Debugger, which allows us to monitor the CHIP-8's inner workings, including its 16 registers, program counter, stack pointer, stack levels, and the index register.

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

Window::Window(int32_t width, int32_t height, const std::string& title, Chip8* chip8Emulator)
	: m_Window(nullptr),
	m_Chip8(chip8Emulator),
	m_Width(width),
	m_Height(height),
	m_VSynch(0)
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

	if (!gladLoadGL(reinterpret_cast<GLADloadfunc>(glfwGetProcAddress)))
	{
		std::cerr << "Error while initializing GLAD" << std::endl;
		return;
	}
	const char* glVersion = reinterpret_cast<const char*>(glGetString(GL_VERSION));
	std::cerr << "OpenGL Version: {" << glVersion << "}" << std::endl;

	m_VSynch = 1;
	glfwSwapInterval(m_VSynch);
	if (m_VSynch == 1)
	{
		std::cout << "VSynch is enabled!" << std::endl;
	}
	else
		std::cout << "VSynch is not enabled!" << std::endl;

	InitOpenGL();
	InitializeImGui();

	glfwSetWindowUserPointer(m_Window, this);
	glfwSetFramebufferSizeCallback(m_Window, FramebufferSizeCallback);
	glfwSetKeyCallback(m_Window, KeyCallback);
}

Window::~Window()
{
	ShutdownImGui();
	glDeleteVertexArrays(1, &m_VAO);
	glDeleteBuffers(1, &m_VBO);
	glDeleteTextures(1, &m_TextureID);
	glDeleteShader(m_VertexShader);
	glDeleteShader(m_FragmentShader);
	glDeleteProgram(m_ShaderProgram);
	glfwDestroyWindow(m_Window);
	glfwTerminate();
}

void Window::Update()
{
	glfwPollEvents();
	glfwSwapBuffers(m_Window);
}

void Window::Clear() const
{
	glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
}

bool Window::ShouldClose() const
{
	return glfwWindowShouldClose(m_Window);
}

int32_t Window::GetWidth() const
{
	return m_Width;
}

int32_t Window::GetHeight() const
{
	return m_Height;
}

void Window::InitOpenGL()
{
	float vertices[] = {
		// Positions  Texture coords.
		-1.0f,  1.0f,  0.0f, 1.0f,
		-1.0f, -1.0f,  0.0f, 0.0f,
		 1.0f, -1.0f,  1.0f, 0.0f,

		-1.0f,  1.0f,  0.0f, 1.0f,
		 1.0f, -1.0f,  1.0f, 0.0f,
		 1.0f,  1.0f,  1.0f, 1.0f
	};

	glGenVertexArrays(1, &m_VAO);
	glGenBuffers(1, &m_VBO);
	glBindVertexArray(m_VAO);

	glBindBuffer(GL_ARRAY_BUFFER, m_VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
	glEnableVertexAttribArray(1);

	glBindBuffer(GL_ARRAY_BUFFER, 0);
	glBindVertexArray(0);

	glGenTextures(1, &m_TextureID);
	glBindTexture(GL_TEXTURE_2D, m_TextureID);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, Chip8::DisplayWidth, Chip8::DisplayHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glBindTexture(GL_TEXTURE_2D, 0);

	m_VertexShader = CompileShader(vertexShaderSource, GL_VERTEX_SHADER);
	m_FragmentShader = CompileShader(fragmentShaderSource, GL_FRAGMENT_SHADER);
	m_ShaderProgram = glCreateProgram();
	LinkProgram(m_ShaderProgram, m_VertexShader, m_FragmentShader);

	glUseProgram(m_ShaderProgram);

	glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
}

GLuint Window::CompileShader(const char* source, GLenum type)
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

void Window::LinkProgram(GLuint program, GLuint vertexShader, GLuint fragmentShader)
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

void Window::InitializeImGui() const
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

void Window::RenderImGui() const
{
	ImGui_ImplOpenGL3_NewFrame();
	ImGui_ImplGlfw_NewFrame();
	ImGui::NewFrame();

	ImGui::DockSpaceOverViewport(0, nullptr, ImGuiDockNodeFlags_NoResize | ImGuiDockNodeFlags_PassthruCentralNode);

	// For the debugger
	float windowHeight = 700.0f;

	ImGui::SetNextWindowSize(ImVec2(DebuggerPanelWidth, windowHeight), ImGuiCond_FirstUseEver);

	ImGui::SetNextWindowDockID(ImGui::GetID("CHIP-8 Debugger"), ImGuiCond_FirstUseEver);
	ImGui::Begin("CHIP-8 Debugger", nullptr, ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize);

	ImGui::Text("Display Frequency: %.1f Hz", ImGui::GetIO().DisplayFramebufferScale.x * glfwGetVideoMode(glfwGetPrimaryMonitor())->refreshRate);

	bool vsyncEnabled = m_VSynch ? true : false;
	ImGui::Text("VSynch: %s", vsyncEnabled ? "On" : "Off");

	ImGui::Text("Frame Time: %.2f ms", 1000.0f / ImGui::GetIO().Framerate);
	ImGui::Text("Delta Time: %.6f ms", ImGui::GetIO().DeltaTime * 1000.0f);

	ImGui::Text("Current Opcode: 0x%04X", m_Chip8->GetOpcode());

	ImGui::Text("Registers:");
	for (int i = 0; i < 16; ++i) {
		ImGui::Text("V%X: 0x%02X", i, m_Chip8->GetRegisters()[i]);
	}
	ImGui::Text("Index Register (I): 0x%04X", m_Chip8->GetIndexRegister());

	ImGui::Text("Stack Levels:");
	for (int i = 0; i < 16; ++i) {
		ImGui::Text("Stack[%d]: 0x%04X", i, m_Chip8->GetStack()[i]);
	}

	ImGui::Text("Stack Pointer (SP): 0x%02X", m_Chip8->GetStackPointer());
	ImGui::Text("Program Counter (PC): 0x%04X", m_Chip8->GetProgramCounter());

	ImGui::End();

	ImGui::Render();
	ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
}

void Window::ShutdownImGui() const
{
	ImGui_ImplOpenGL3_Shutdown();
	ImGui_ImplGlfw_Shutdown();
	ImGui::DestroyContext();
}

void Window::FramebufferSizeCallback(GLFWwindow* window, int width, int height)
{
	glViewport(0, 0, width - DebuggerPanelWidth, height);
}

void Window::KeyCallback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
	Window* winInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));
	if (!winInstance || !winInstance->m_Chip8)
		return;

	if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);

	if (action == GLFW_PRESS || action == GLFW_RELEASE)
	{
		bool isPressed = (action == GLFW_PRESS);

		switch (key)
		{
            case GLFW_KEY_3:
            {
                winInstance->m_Chip8->SetKeyState(1, isPressed);
                break;
            }
            case GLFW_KEY_4:
            {
                winInstance->m_Chip8->SetKeyState(2, isPressed);
                break;
            }
            case GLFW_KEY_5:
            {
                winInstance->m_Chip8->SetKeyState(3, isPressed);
                break;
            }
            case GLFW_KEY_6:
            {
                winInstance->m_Chip8->SetKeyState(0xC, isPressed);
                break;
            }
            case GLFW_KEY_E:
            {
                winInstance->m_Chip8->SetKeyState(4, isPressed);
                break;
            }
            case GLFW_KEY_R:
            {
                winInstance->m_Chip8->SetKeyState(5, isPressed);
                break;
            }
            case GLFW_KEY_T:
            {
                winInstance->m_Chip8->SetKeyState(6, isPressed);
                break;
            }
            case GLFW_KEY_Y:
            {
                winInstance->m_Chip8->SetKeyState(0xD, isPressed);
                break;
            }
            case GLFW_KEY_D:
            {
                winInstance->m_Chip8->SetKeyState(7, isPressed);
                break;
            }
            case GLFW_KEY_F:
            {
                winInstance->m_Chip8->SetKeyState(8, isPressed);
                break;
            }
            case GLFW_KEY_G:
            {
                winInstance->m_Chip8->SetKeyState(9, isPressed);
                break;
            }
            case GLFW_KEY_H:
            {
                winInstance->m_Chip8->SetKeyState(0xE, isPressed);
                break;
            }
            case GLFW_KEY_C:
            {
                winInstance->m_Chip8->SetKeyState(0xA, isPressed);
                break;
            }
            case GLFW_KEY_V:
            {
                winInstance->m_Chip8->SetKeyState(0, isPressed);
                break;
            }
            case GLFW_KEY_B:
            {
                winInstance->m_Chip8->SetKeyState(0xB, isPressed);
                break;
            }
            case GLFW_KEY_N:
            {
                winInstance->m_Chip8->SetKeyState(0xF, isPressed);
                break;
            }
            default:
                break;
		}
	}
}
```
Consult {{< coloredLink url="https://www.glfw.org/documentation" >}}GLFW Documentation{{< /coloredLink >}}, {{< coloredLink url="https://github.com/ocornut/imgui/tree/master/examples" >}}ImGui Examples{{< /coloredLink >}}, and the best of all time {{< coloredLink url="https://docs.gl/" >}}OpenGL Docs{{< /coloredLink >}} for more specific information.

#### The Main Loop
Finally, our main loop orchestrates the calling of ****{{< colour >}}Chip8::EmulateCycle(){{< /colour>}}**** and ****{{< colour >}}Chip8::UpdateTimers(){{< /colour>}}****, each running off its own clock. It makes use of the window layer to handle input events, providing interaction with the emulator, and to render.

I'll be utilizing three command-line arguments. Using command-line arguments allows us to configure and customize how the emulator behaves each time we run it, without needing to edit the emulator's code. It's a way to provide input parameters, like in our case we have three:

1. **{{< colour >}}Video Scale{{< /colour >}}**: Allows to adjust the visual size of the emulator's display. By specifying a scale factor, we can control the dimensions of the virtual CHIP-8 screen. Given that I'm using a 300x700 ImGui window debugger for tracking CHIP-8 components like the stack, registers, PC, etc., I recommend using a scale factor above 20.
2. **{{< colour >}}Cycle Rate{{< /colour >}}**: Crucial for regulating the emulation speed. By setting an appropriate rate value, we can control how quickly the emulator progresses through each cycle, simulating the original CHIP-8 hardware's execution speed. Typically, CHIP-8 has a cycle rate of 500.
3. **{{< colour >}}ROM File{{< /colour >}}**: Which allows for loading different CHIP-8 programs into the emulator.

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

constexpr int32_t TimerRate = 60;
constexpr auto TimerPeriod = std::chrono::microseconds(1000000 / TimerRate);
constexpr uint32_t DisplaySize = Chip8::DisplayWidth * Chip8::DisplayHeight;

int main(int argc, char* argv[])
{
	if (argc != 4)
	{
		std::cerr << "Usage: " << argv[0] << " <Video Scale> <Cycle Rate> <ROM>\n";
		return 1;
	}

	int32_t videoScale = std::atoi(argv[1]);
	int32_t cycleRate = std::atoi(argv[2]);
	char const* romFilename = argv[3];

	const auto chip8CyclePeriod = std::chrono::microseconds(1000000 / cycleRate);

	Chip8 myChip8;
	Window window(Chip8::DisplayWidth * videoScale, Chip8::DisplayHeight * videoScale, "CHIP-8 Emulator", &myChip8);

	myChip8.LoadROM(romFilename);

	auto lastCycleTime = std::chrono::high_resolution_clock::now();

	uint32_t* flippedDisplay = new uint32_t[DisplaySize];

	auto lastTimerTime = lastCycleTime;
	const GLuint texture = window.GetTexture();
	const GLuint vao = window.GetVAO();

	while (!window.ShouldClose())
	{
		auto now = std::chrono::high_resolution_clock::now();
		while (now - lastCycleTime > chip8CyclePeriod)
		{
			myChip8.EmulateCycle();
			lastCycleTime += chip8CyclePeriod;
		}

		while (now - lastTimerTime > TimerPeriod)
		{
			myChip8.UpdateTimers();
			lastTimerTime += TimerPeriod;
		}

		window.Clear();
		glBindTexture(GL_TEXTURE_2D, texture);

		const auto& display = myChip8.GetDisplay();

		// Flipping the display vertically.
		for (uint32_t y = 0; y < Chip8::DisplayHeight; y++)
		{
			for (uint32_t x = 0; x < Chip8::DisplayWidth; x++)
			{
				flippedDisplay[x + (Chip8::DisplayHeight - 1 - y) * Chip8::DisplayWidth] = display[x + y * Chip8::DisplayWidth];
			}
		}

		glViewport(0, 0, Chip8::DisplayWidth * videoScale - Window::DebuggerPanelWidth, Chip8::DisplayHeight * videoScale);
		glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, Chip8::DisplayWidth, Chip8::DisplayHeight, GL_RGBA, GL_UNSIGNED_BYTE, flippedDisplay);

		glBindVertexArray(vao);
		glDrawArrays(GL_TRIANGLES, 0, 6);
		glBindVertexArray(0);
		glBindTexture(GL_TEXTURE_2D, 0);

		window.RenderImGui();
		window.Update();
	}

	delete[] flippedDisplay;
	return 0;
}
```
With each iteration of the loop, the CHIP-8 emulator processes CPU operations according to the set cycle rate, updates its timers on their own fixed 60Hz clock, employs OpenGL to display the graphics, and manages window events. The display is flipped vertically before passing to OpenGL for rendering, primarily because OpenGL's coordinate system originates from the bottom-left, whereas CHIP-8's display starts from the top-left. For more details about the [{{< colour >}}Window Layer{{< /colour >}}](#the-window-layer), refer to its dedicated section.

#### In Action!
Now it's time to test if our CPU is operating like we expect. Check this {{< coloredLink url="https://github.com/dmatlack/chip8/tree/master/roms" >}}CHIP-8 Program Pack{{< /coloredLink >}} for ROMs.

{{< highlight plaintext >}}
> chip8 25 100 test_opcode.ch8
{{< /highlight >}}

{{< figure src="/images/chip8-test_opcode.png" alt="Running test_opcode.ch8 on the CHIP-8 Emulator" width="800px" height="500px">}}

{{< video src="/videos/chip8-test_opcode.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

{{< highlight plaintext >}}
> chip8 25 300 cave.ch8
{{< /highlight >}}

{{< video src="/videos/chip8-cave.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

This game is harder than it looks.

{{< highlight plaintext >}}
> chip8 25 300 tetris.ch8
{{< /highlight >}}

{{< video src="/videos/chip8-tetris.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

#### Conclusion
That's it, we've successfully built our very first emulator! Personally, I feel like this journey has deepened my understanding of low-level computer fundamentals - knowledge I'll surely leverage in future programming adventures. I'm considering building an NES emulator next, or I might take the hardware route and craft a physical CHIP-8 machine, once I explore Verilog and FPGA :)

#### Source Code
You can find all the code {{< coloredLink url="https://github.com/Saeb0x/CHIP-8" >}}here{{< /coloredLink >}}.
***
Last Edited: August 2, 2026