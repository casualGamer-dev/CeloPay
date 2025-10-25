"use client";
import { useEffect, useState } from "react";
import ClientThemeProvider from "../../components/ClientThemeProvider";
import { Container, Paper, Stack, Typography, Divider, TextField, Button } from "@mui/material";
import { useAccount, useConnect, useWriteContract } from "wagmi";
import { ProfileRegistryAbi } from "../../lib/onchain/ProfileRegistry.abi";
import { readProfile } from "../../lib/onchain/profileAdapter";
const REGISTRY = process.env.NEXT_PUBLIC_PROFILEREGISTRY_ADDRESS as `0x${string}`;
export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  useEffect(()=>{(async()=>{ if(!address) return; try{ const p=await readProfile(address); if(p.set){ setName(p.name||""); setPhone(p.phone||""); } } catch{} })();},[address]);
  async function onConnect(){ const c = connectors?.[0]; if(!c) return alert("No wallet connector available."); await connect({ connector: c }); }
  async function onSave(){ if(!isConnected||!address) return alert("Connect wallet first."); if(!REGISTRY) return alert("ProfileRegistry address missing in env."); const tx=await writeContractAsync({ address: REGISTRY, abi: ProfileRegistryAbi, functionName: "setProfile", args: [name.trim(), phone.trim()] }); alert(`Profile saved on-chain:\n${tx}`); }
  return (<ClientThemeProvider>
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={600}>Your Profile (On-Chain)</Typography>
          <Typography variant="body2" color="text.secondary">Fill this form <b>before</b> connecting. Then save to chain from your wallet.</Typography>
          <Divider/>
          <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} fullWidth />
          <TextField label="Contact number" value={phone} onChange={(e)=>setPhone(e.target.value)} fullWidth inputProps={{ inputMode:"tel" }} />
          <Stack direction={{ xs:"column", sm:"row" }} spacing={1}>
            {!isConnected ? (
              <Button variant="contained" onClick={onConnect} disabled={isConnecting} sx={{ flex:1 }}>{isConnecting?"Connecting...":"Connect Wallet"}</Button>
            ) : (
              <Button variant="contained" onClick={onSave} disabled={isWriting} sx={{ flex:1 }}>{isWriting?"Saving...":"Save Profile On-Chain"}</Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">{isConnected?`Connected: ${address}`:"No wallet connected"}</Typography>
        </Stack>
      </Paper>
    </Container>
  </ClientThemeProvider>); }
