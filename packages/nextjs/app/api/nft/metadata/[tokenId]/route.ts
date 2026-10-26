import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

// 创建公共客户端来读取合约
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId;

    if (!tokenId) {
      return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
    }

    // 从 YourCollectible 合约获取 tokenURI
    const tokenURI = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_YOUR_COLLECTIBLE_ADDRESS as `0x${string}`,
      abi: [
        {
          inputs: [{ name: "tokenId", type: "uint256" }],
          name: "tokenURI",
          outputs: [{ name: "", type: "string" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });

    if (!tokenURI) {
      return NextResponse.json({ error: "Token URI not found" }, { status: 404 });
    }

    // 如果是 IPFS URL，转换为可访问的 URL
    let metadataUrl = tokenURI as string;
    if (metadataUrl.startsWith("ipfs://")) {
      metadataUrl = metadataUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    // 获取元数据
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
    }

    const metadata = await metadataResponse.json();

    // 如果图片是 IPFS URL，也转换一下
    if (metadata.image && metadata.image.startsWith("ipfs://")) {
      metadata.image = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}