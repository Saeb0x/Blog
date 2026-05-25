---
title: "32-Bit MIPS ALU: Simulation"
date: 2024-01-09
description: "Simulating and validating the 32-bit MIPS ALU on DE1 and DE2 FPGA boards using ModelSim and seven-segment display output."
tags: ["vhdl", "computer architecture", "digital design", "mips", "fpga"]
draft: false
---

I recently completed the {{< coloredLink url="https://saebnaser.blog/post/32-bit-mips-alu-design/" color="#FEFE54" >}}design and implementation{{< /coloredLink >}} of my Final Year Project. However, during the simulation phase near the end, I realized that the Cyclone V SX SoC Development Kit wasn't the best match for this type of project. As I said I would in my previous post, I discussed this with my supervisor, and fortunately, I got my hands on not only the {{< coloredLink url="https://www.terasic.com.tw/cgi-bin/page/archive.pl?No=83" color="#FEFE54" >}}DE1{{< /coloredLink >}} board but also the {{< coloredLink url="https://www.terasic.com.tw/cgi-bin/page/archive.pl?No=30" color="#FEFE54" >}}DE2{{< /coloredLink >}}.

I want to dedicate this post not only to testing and simulating my FYP design, but also to sharing my approach to using {{< coloredLink url="https://saebnaser.blog/post/32-bit-mips-alu-design/#fpga" color="#FEFE54" >}}FPGA{{< /coloredLink >}} development boards and how I deal with them.

1. [{{< colour color="#FEFE54" >}}Knowing The Board{{< /colour >}}](#knowing-the-board)
2. [{{< colour color="#FEFE54" >}}Burning VHDL{{< /colour >}}](#burning-vhdl)
3. [{{< colour color="#FEFE54" >}}Back To 32-Bit MIPS ALU{{< /colour >}}](#back-to-32-bit-mips-alu)
4. [{{< colour color="#FEFE54" >}}Conclusion{{< /colour >}}](#conclusion)
5. [{{< colour color="#FEFE54" >}}Source Code{{< /colour >}}](#source-code)

I have experience with the DE1 board from my Digital Computer Design course labs. It's a solid and reliable board, easy to work with. But after  giving it some thought, I realized that choosing the DE1 over the DE2 would be a big mistake. The DE2 board offers more advanced features and higher performance, like an improved version of the DE1, even down to its layout. That's why I'll go with it.

#### Knowing The Board

Starting with the {{< coloredLink url="https://www.terasic.com.tw/cgi-bin/page/archive_download.pl?Language=English&No=30&FID=ab73908ea64e51be175534c8101942b7" color="#FEFE54" >}}User Manual{{< /coloredLink >}} is a smart move to know the board. I usually just skim through the important parts instead of reading it all in detail. The most important aspects for us are understanding the layout, components, and pin assignments of the board.

Pin assignments determine which physical pins on the FPGA are connected to specific components, so that we can map our logical design to physical hardware. For example, in DE2 board, we have 18 switches. By referring to the {{< coloredLink url="https://www.terasic.com.tw/cgi-bin/page/archive_download.pl?Language=English&No=30&FID=3bc5410e25f903b5d6210c07ff584eb2" color="#FEFE54" >}}Pin Table{{< /coloredLink >}}, we can find their pin assignments. Now that everything makes sense, we're good to go.

#### Burning VHDL

Let's start with a simple VHDL design to burn onto the board and then try simulating it. I want to program the board so that different two-bit inputs from switches SW0 and SW1 will display different characters on one of the seven-segment displays. For example, when the input is '00', it will display 'S', for '01' it will display 'A', for '10' it will display 'E', and for '11' it will display 'B'. 

````vhdl
library IEEE;
use IEEE.std_logic_1164.all;

entity SevenSegmentDisplay is
	port(
			-- Input
			charSelect : in std_logic_vector(1 downto 0); -- Character selection

			-- Output
			segDisplay :  out std_logic_vector(6 downto 0) -- 7-Segment display
		);
end SevenSegmentDisplay;

architecture Behavioral of SevenSegmentDisplay is
begin
	process(charSelect)
	begin
		case charSelect is
			when "00" => segDisplay <= "0010010"; -- Displays 'S'
			when "01" => segDisplay <= "0001000"; -- Displays 'A'                     
			when "10" => segDisplay <= "0000110"; -- Displays 'E'
			when "11" => segDisplay <= "0000000"; -- Displays 'B'
			when others => segDisplay <= "1111111"; -- All segments off
		end case;	
	end process;
end Behavioral;
````
Using {{< coloredLink url="https://www.intel.com/content/www/us/en/software-kit/711791/intel-quartus-ii-web-edition-design-software-version-13-0sp1-for-windows.html" color="#FEFE54" >}}Intel Quartus Web Edition{{< /coloredLink >}} this time is a good choice. Following the user manual, it's important to select the device when creating a new project. Then, we assign the logical ports to physical pins on the board using the pin planner, following the pin table as before.

{{< figure src="/images/PinPlanner.png" alt="Pin Planner Screenshot" width="700px" height="700px">}}

Next, we move to the Programmer tool, where we carry out the process of burning the VHDL code onto the FPGA on the board, along with all the mapped pins.

{{< figure src="/images/ProgrammerTool.png" alt="Programmer Tool Screenshot" width="700px" height="700px">}}

Now we simulate!

{{< video src="/videos/SevenSegmentDisplay_Simulation.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

Before returning to our MIPS ALU, let's add a twist. I want to make use of four consecutive seven-segment displays, with each segment being controlled by two switches, totaling 8 switches for all displays.

````vhdl
library IEEE;
use IEEE.std_logic_1164.all;

entity MultiSegmentDisplay is
    Port(
	    	-- Input
	        switches : in std_logic_vector(7 downto 0); -- 8 switches

	        -- Output
	        seg_display : out std_logic_vector(27 downto 0) -- 4 seven-segment displays, each 7 bits
    	);
end MultiSegmentDisplay;

architecture Behavioral of MultiSegmentDisplay is
begin
    process(switches)
    begin
        -- Display 1, controlled by switches(1 downto 0)
        case switches(1 downto 0) is
            when "00" => seg_display(6 downto 0) <= "0010010"; -- 'S'
            when "01" => seg_display(6 downto 0) <= "0001000"; -- 'A'
            when "10" => seg_display(6 downto 0) <= "0000110"; -- 'E'
            when "11" => seg_display(6 downto 0) <= "0000000"; -- 'B'
            when others => seg_display(6 downto 0) <= "1111111"; -- All segments off
        end case;

        -- Display 2, controlled by switches(3 downto 2)
        case switches(3 downto 2) is
            when "00" => seg_display(13 downto 7) <= "0010010"; 
            when "01" => seg_display(13 downto 7) <= "0001000"; 
            when "10" => seg_display(13 downto 7) <= "0000110"; 
            when "11" => seg_display(13 downto 7) <= "0000000";
            when others => seg_display(13 downto 7) <= "1111111";
        end case;

        -- Display 3, controlled by switches(5 downto 4)
        case switches(5 downto 4) is
            when "00" => seg_display(20 downto 14) <= "0010010"; 
            when "01" => seg_display(20 downto 14) <= "0001000"; 
            when "10" => seg_display(20 downto 14) <= "0000110"; 
            when "11" => seg_display(20 downto 14) <= "0000000"; 
            when others => seg_display(20 downto 14) <= "1111111";
        end case;

        -- Display 4, controlled by switches(7 downto 6)
        case switches(7 downto 6) is
            when "00" => seg_display(27 downto 21) <= "0010010"; 
            when "01" => seg_display(27 downto 21) <= "0001000"; 
            when "10" => seg_display(27 downto 21) <= "0000110"; 
            when "11" => seg_display(27 downto 21) <= "0000000";
            when others => seg_display(27 downto 21) <= "1111111";
        end case;
    end process;
end Behavioral;
````
{{< figure src="/images/PinPlanner2.png" alt="Pin Planner 2 Screenshot" width="700px" height="700px">}}

{{< video src="/videos/SevenSegmentDisplay_Simulation2.mp4" autoplay="false" controls="true" loop="false" muted="false" width="640" height="360" >}}

#### Back To 32-Bit MIPS ALU
In a single-cycle MIPS CPU design, like mine, every instruction is designed to execute in a single clock cycle. This means that all the stages of instruction execution—fetch, decode, execute, memory access, and write-back—occur within a single clock cycle. The cycle's length is based on the time it takes for the slowest instruction. This is usually determined by the longest path an instruction takes, often the load word (lw) instruction.

While this single-cycle approach simplifies the control logic and makes it easier to understand and implement, it usually needs a longer clock period to handle the slowest instruction because all operations must finish within one cycle. This can restrict the CPU's overall clock speed. In contrast, multi-cycle architectures spread different stages of instruction execution over multiple cycles, potentially enabling a higher clock speed but demanding more complex control logic.

Let me break down everything that should happen in a single cycle:

1. {{< colour color="#FEFE54" >}}Instruction Fetch{{< /colour >}}: The instruction is fetched from the Instruction Memory, where our test program is.

2. {{< colour color="#FEFE54" >}}Instruction Decode{{< /colour >}}: The fetched instruction is decoded to understand what operation is to be performed and which registers are involved.

3. {{< colour color="#FEFE54" >}}Execute{{< /colour >}}: The operation specified by the instruction is executed, which might involve arithmetic or logical operations in the ALU, address calculation for memory operations, etc.

4. {{< colour color="#FEFE54" >}}Memory Access (if needed){{< /colour >}}: Data is read from or written to the memory.

5. {{< colour color="#FEFE54" >}}Write-back{{< /colour >}}: The result of the execution is written back to a register if required by the instruction.

Since I didn't write a test bench for the {{< coloredLink url="https://saebnaser.blog/post/32-bit-mips-alu-design/#simulation-on-cyclone-v-soc-development-kit" color="#FEFE54" >}}top level{{< /coloredLink >}} module I implemented in the design, let's write one now.
```vhdl
library IEEE;
use IEEE.std_logic_1164.all;

entity TopLevel_tb is
    -- No ports required
end TopLevel_tb;

architecture behavior of TopLevel_tb is
    component TopLevel
        GENERIC (n : integer := 32);
        port(
            CLK, reset_neg : in std_logic
        );
    end component;

    signal CLK, reset_neg : std_logic := '0';

begin
    -- Instantiate the Unit Under Test (UUT)
    uut: TopLevel
        generic map (n => 32)
        port map (
            CLK => CLK,
            reset_neg => reset_neg
        );

    -- Clock generation
    clocking: process
    begin
        for i in 1 to 20 loop  -- Each cycle is 20 ns, 20*10 ns = 200 ns for 10 instructions
            CLK <= not CLK;  -- Toggle clock
            wait for 10 ns;  -- Half period of 20 ns cycle
        end loop;
        wait;  -- Stop after the last cycle
    end process;

    initial_setup: process
    begin
        reset_neg <= '0';  -- Assert 
        wait for 20 ns;    -- Hold reset for initialization
        reset_neg <= '1';  -- Deassert 
        wait;              -- Continue until simulation stops after 200 ns
    end process;

end behavior;

```
This test bench simulates the operation of the single-cycle MIPS CPU, focusing on the sequential execution of 10 instructions across 10 full clock cycles, totaling 200ns. It initializes the clock and active-low reset signals, toggling the clock every 10ns to maintain a 50MHz frequency, thereby establishing a 20ns clock period. The reset is initially asserted and then deasserted to ensure the processor starts from a known state.

{{< figure src="/images/TopLevel_tb_Waveform.png" alt="Top Level Testbench Waveform" width="700px" height="700px">}}

>##### Note
>I screenshotted the waveform from {{< coloredLink url="https://www.intel.com/content/www/us/en/software-kit/750368/modelsim-intel-fpgas-standard-edition-software-version-18-1.html" color="#FEFE54" >}}Intel ModelSim{{< /coloredLink >}} software, as I couldn't find a better way to export it in higher quality. For better viewing, open it in a new tab. Feedback from experienced users on waveform exporting is welcome.
>

Let's take the first full cycle of our execution, which is according to our test program inside our Instruction Memory is an I-type instruction {{<colour color="#FEFE54">}}addi $R1, $R0, 30{{< /colour >}}. 

{{< figure src="/images/InstructionMemory_addi.png" alt="I-type instruction addi in the Instruction Memory" width="500px" height="500px">}}

As I detailed in my design post, each MIPS instruction spans 32 bits, which is equivalent to 4 bytes. To accommodate this in the Instruction Memory, I allocated four consecutive memory addresses for each individual instruction. Similarly, the Assembler operates by encoding each instruction into 4 bytes to align with our design. It's important to note that if an instruction begins at address 0, it will occupy the bytes at addresses 0, 1, 2, and 3. Hence, to move to the next instruction, we increment the program counter by 4. For further details, refer to the {{< coloredLink url="https://saebnaser.blog/post/32-bit-mips-alu-design/#instruction-memory" color="#FEFE54" >}}Instruction Memory{{< /coloredLink >}} section in my previous blog post.

{{< figure src="/images/TopLevel_tb_Waveform_addi.png" alt="addi waveform" width="700px" height="700px">}}

Now we can clearly see that our complete 32-bit instruction is the concatenation of the 4 bytes occupying the first 4 addresses: 0, 1, 2, and 3, resulting in the full instruction {{<colour color="#FEFE54">}}00100000000000010000000000011110{{< /colour >}}.

According to the way I designed the {{< coloredLink url="https://saebnaser.blog/post/32-bit-mips-alu-design/#control-unit" color="#FEFE54" >}}Control Unit{{< /coloredLink >}}, which generates control signals for various components within the processor based on our input instruction (addi in this case), we should expect an 11-bit data signal to set the control signals. In our case, the data signal is {{<colour color="#FEFE54">}}000000000011{{< /colour >}}, which perfectly aligns with our implementation.

{{< figure src="/images/ControlUnit_addi.png" alt="addi instruction data signal" width="700px" height="700px">}}

Returning to our primary focus, the ALU, we observe that the ALUOp, indicating the ALU operation to be performed, is set to {{<colour color="#FEFE54">}}0000{{< /colour >}}. This precisely matches our design, where 0000 signifies addition operations.

Moving to the next instruction {{<colour color="#FEFE54">}}sw $R1,0($R0){{< /colour >}}.

{{< figure src="/images/Testbench_tb_SimulationWaveform_storeword.png" alt="store word (sw) waveform" width="700px" height="700px">}}

The full instruction, {{<colour color="#FEFE54">}}10101100000000010000000000000000{{< /colour >}}, perfectly aligns with our layout in the Instruction Memory. Additionally, the data signal, {{<colour color="#FEFE54">}}000000000110{{< /colour >}}, matches the control signal settings in the Control Unit. Regarding the ALUOp, it remains at 0000 because this instruction is a Memory write (store word), not an ALU operation. However, if you review the waveform, you'll notice that the ALUOp changes multiple times, indicating that we encountered 5 ALU operations in our test program.

With our DE2 board, we can supply a 50MHz clock, achieving the same results.

#### Conclusion
This marks the conclusion of one of the most enjoyable and challenging projects I've worked on. Undoubtedly, in the days to come, I'll encounter numerous bugs and mistakes, as is typical with any project. I'll do my best to update these blogs regularly, but for now, that's all.

#### Source Code
You can find all the code {{< coloredLink url="https://github.com/Saeb0x/MIPS32-ALU" color="#FEFE54" >}}here{{< /coloredLink >}}.

***
Last Edited: May 24, 2026