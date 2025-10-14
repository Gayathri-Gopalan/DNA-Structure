import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './index.css';
const BASE_COLORS = { A: 0xFF6B35, T: 0xFF1493, G: 0x4169E1, C: 0x32CD32 };
const BASE_PAIRS = { 
  A: { complement: 'T', hBonds: 2 }, 
  T: { complement: 'A', hBonds: 2 }, 
  G: { complement: 'C', hBonds: 3 }, 
  C: { complement: 'G', hBonds: 3 } 
};

// Genetic code for amino acid translation (mRNA codons with U, not T)
const GENETIC_CODE = {
  'UUU': 'Phe', 'UUC': 'Phe', 'UUA': 'Leu', 'UUG': 'Leu',
  'UCU': 'Ser', 'UCC': 'Ser', 'UCA': 'Ser', 'UCG': 'Ser',
  'UAU': 'Tyr', 'UAC': 'Tyr', 'UAA': 'STOP', 'UAG': 'STOP',
  'UGU': 'Cys', 'UGC': 'Cys', 'UGA': 'STOP', 'UGG': 'Trp',
  'CUU': 'Leu', 'CUC': 'Leu', 'CUA': 'Leu', 'CUG': 'Leu',
  'CCU': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
  'CAU': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln',
  'CGU': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
  'AUU': 'Ile', 'AUC': 'Ile', 'AUA': 'Ile', 'AUG': 'Met',
  'ACU': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
  'AAU': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys',
  'AGU': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
  'GUU': 'Val', 'GUC': 'Val', 'GUA': 'Val', 'GUG': 'Val',
  'GCU': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
  'GAU': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
  'GGU': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly'
};

// Step 1: Transcribe DNA to mRNA (T→U conversion for coding strand)
const transcribeDNAtoRNA = (dnaSeq) => {
  // DNA coding strand (5'→3') has same sequence as mRNA except T→U
  return dnaSeq.replace(/T/g, 'U');
};
// Step 2: Translate mRNA to protein using genetic code
const translateRNAtoProtein = (mrnaSeq) => {
  const protein = [];
  for (let i = 0; i < mrnaSeq.length - 2; i += 3) {
    const codon = mrnaSeq.substring(i, i + 3);
    if (codon.length === 3) {
      protein.push(GENETIC_CODE[codon] || '?');
    }
  }
  return protein;
};

// Combined function: DNA → mRNA → Protein
const translateDNAtoProtein = (dnaSeq) => {
  const mrna = transcribeDNAtoRNA(dnaSeq);
  const protein = translateRNAtoProtein(mrna);
  return { mrna, protein };
};

const facts = [
  'DNA stands for Deoxyribonucleic Acid',
  'Adenine pairs with Thymine (2 H-bonds)',
  'Guanine pairs with Cytosine (3 H-bonds)',
  'Watson & Crick discovered double helix in 1953',
  'Human DNA has ~3 billion base pairs',
  'G-C pairs stronger than A-T pairs',
  'Purines (A,G) have 2 rings; Pyrimidines (T,C) have 1',
  'DNA replication occurs during cell division',
  'UV light can damage DNA structure',
  'All life uses the same DNA code',
  'Mitochondrial DNA inherited maternally',
  'DNA polymerase reads 3 to 5 direction',
  'Telomeres protect chromosome ends',
  'Uracil replaces thymine in RNA',
  'DNA wound around histone proteins',
  'DNA replication is semi-conservative',
  'Mutations: silent, missense, or nonsense',
  'RNA contains ribose; DNA has deoxyribose',
  'Epigenetic changes do not alter DNA sequence',
  'Genetic code nearly universal across life'
];

const useSoundEffects = (enabled) => {
  const audioContextRef = useRef(null);
  
  useEffect(() => { 
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);
  
  const playSound = (f, d, t = 'sine') => {
    if (!enabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = f;
    osc.type = t;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + d);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + d);
  };
  
  return { 
    playClick: () => playSound(800, 0.05, 'square'), 
    playSuccess: () => { 
      playSound(523.25, 0.1); 
      setTimeout(() => playSound(659.25, 0.1), 100); 
      setTimeout(() => playSound(783.99, 0.2), 200); 
    }, 
    playError: () => playSound(200, 0.3),
    playCombo: (level) => playSound(800 + level * 100, 0.15, 'sine')
  };
};

const FactsModal = ({ fact, onClose, onNext }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl border-4 border-yellow-400 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b-2 border-yellow-400 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-yellow-300">DNA Fact</h2>
          <button onClick={onClose} className="text-yellow-300 text-3xl font-bold hover:text-yellow-400">✕</button>
        </div>
        <div className="p-8">
          <div className="bg-black/30 rounded-xl p-6 mb-6 border-2 border-cyan-500">
            <p className="text-white text-xl leading-relaxed text-center">{fact}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onNext} className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-bold text-white text-lg">
              Next Fact
            </button>
            <button onClick={onClose} className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-6 py-4 rounded-xl font-bold text-white text-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function MutationGenerator({ sequence, onApplyMutation, onExit, sounds }) {
  const [mutationCount, setMutationCount] = useState(1);
  const [mutationType, setMutationType] = useState('Substitution');
  const [mutatedSeq, setMutatedSeq] = useState(sequence);
  const [mutationLog, setMutationLog] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [mutatedPositions, setMutatedPositions] = useState([]);
const [isSickleCellMode, setIsSickleCellMode] = useState(false);
  const containerRef = useRef();
  const BASES = ['A', 'T', 'C', 'G'];
  
  useEffect(() => { 
    setMutatedSeq(sequence); 
    setShowComparison(false);
  }, [sequence]);
  
  const calculateStats = (seq) => {
    const gcCount = (seq.match(/[GC]/g) || []).length;
    const gcContent = ((gcCount / seq.length) * 100).toFixed(1);
    const { mrna, protein } = translateDNAtoProtein(seq);
    return { gcContent, length: seq.length, mrna, protein };
  };
  
  const generateMutations = () => {
    let seqArr = sequence.split('');
    let log = [];
    let positions = [];
    const randBase = (ex) => BASES.filter(b => b !== ex)[Math.floor(Math.random() * 3)];
    
    if (mutationType === 'Substitution') {
      for (let i = 0; i < mutationCount; i++) {
        const p = Math.floor(Math.random() * seqArr.length);
        const o = seqArr[p];
        const m = randBase(o);
        seqArr[p] = m;
        log.push(`Substitution at position ${p + 1}: ${o} → ${m}`);
        positions.push(p);
      }
    } else if (mutationType === 'Insertion') {
      for (let i = 0; i < mutationCount; i++) {
        const p = Math.floor(Math.random() * (seqArr.length + 1));
        const ins = BASES[Math.floor(Math.random() * 4)];
        seqArr.splice(p, 0, ins);
        log.push(`Insertion at position ${p + 1}: ${ins} inserted`);
        positions.push(p);
      }
    } else {
      if (seqArr.length <= mutationCount) {
        alert('Sequence too short for deletion');
        return;
      }
      let pos = new Set();
      while (pos.size < mutationCount) {
        pos.add(Math.floor(Math.random() * seqArr.length));
      }
      Array.from(pos).sort((a, b) => b - a).forEach(p => {
        log.push(`Deletion at position ${p + 1}: ${seqArr[p]} removed`);
        seqArr.splice(p, 1);
      });
    }
    
    setMutatedSeq(seqArr.join(''));
    setMutationLog(log);
    setMutatedPositions(positions);
    setShowComparison(true);
    sounds.playClick();
  };
  
  const applyPreset = (type) => {
    let seqArr = sequence.split('');
    let log = [];
    let positions = [];
   if (type === 'sickle-cell') {
  // Beta-globin gene with GAG at codon 6
  // Normal: ATG GTG CAT CTG ACT GAG GAG
  // Amino:  Met Val His Leu Thr Glu Glu
  const normalSeq = 'ATGGTGCATCTGACTGAGGAG';  // 21bp
  
  // Start fresh with the normal sequence (don't use existing sequence)
  let seqArr = normalSeq.split('');
  
  // Apply the A→T mutation at position 17 (0-indexed: position 16)
  // This changes codon 6 from GAG (Glu) to GTG (Val)
  // Codon 6 is at indices 15-17: G[A]G → G[T]G
  seqArr[16] = 'T';  // Change the middle nucleotide of codon 6
  
  setMutatedSeq(seqArr.join(''));
  log.push('Sickle Cell Anemia: A→T mutation at position 17 (codon 6: GAG→GTG, Glu→Val)');
  log.push('Beta-globin gene mutation causing abnormal hemoglobin (HbS)');
  log.push('Result: Red blood cells become sickle-shaped under low oxygen');
  positions.push(16);  // 0-indexed position of the mutation
setIsSickleCellMode(true); //
}
    setMutatedSeq(seqArr.join(''));
    setMutationLog(log);
    setMutatedPositions(positions);
    setShowComparison(true);
    sounds.playClick();
  };
  
  const originalStats = calculateStats(sequence);
  const mutatedStats = calculateStats(mutatedSeq);
  
  return (
    <div className="w-full h-full flex bg-gray-900">
      <div className="w-1/2 p-4 overflow-y-auto border-r border-cyan-500/30">
        <div className="max-w-7xl mx-auto w-full space-y-4">
          <div className="bg-purple-900 p-6 rounded-xl border-2 border-purple-500">
            <h3 className="text-3xl font-bold text-yellow-300 mb-4 text-center">DNA Mutation Generator</h3>
            
           <div className="bg-blue-900/50 border-2 border-blue-500 rounded-lg p-3 mb-4">
  <p className="text-blue-200 text-sm font-bold mb-2">How to Use:</p>
  <ol className="text-blue-100 text-xs space-y-1 list-decimal list-inside">
    <li><strong>Random Mutations:</strong> Choose type → Set count → Click "Generate Random"</li>
    <li><strong>Sickle Cell Anemia:</strong> Click button directly (uses pre-defined mutation)</li>
    <li>Review DNA→mRNA→Protein changes below</li>
    <li>Click "Show in 3D" to visualize mutations (glowing bases)</li>
    <li>Click "Reset" to clear and start over</li>
  </ol>
  <div className="mt-2 p-2 bg-yellow-900/40 border border-yellow-500/50 rounded">
    <p className="text-yellow-200 text-xs">
      ⚠️ <strong>Note:</strong> Sickle Cell preset uses a specific beta-globin sequence (21bp) with an A→T mutation at position 17. Mutation type and count settings are ignored.
    </p>
  </div>
</div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
  <div className={`bg-black/30 rounded-xl p-4 ${isSickleCellMode ? 'opacity-50' : ''}`}>
    <label className="text-cyan-300 font-semibold mb-2 block">
      Mutations: {mutationCount}
      {isSickleCellMode && <span className="text-xs text-yellow-300 ml-2">(Disabled)</span>}
    </label>
    <input 
      type="range" 
      min="1" 
      max="5" 
      value={mutationCount} 
      onChange={e => setMutationCount(Number(e.target.value))} 
      className="w-full" 
      disabled={isSickleCellMode}
    />
  </div>
  
  <div className={`bg-black/30 rounded-xl p-4 ${isSickleCellMode ? 'opacity-50' : ''}`}>
    <label className="text-cyan-300 font-semibold mb-3 block">
      Type:
      {isSickleCellMode && <span className="text-xs text-yellow-300 ml-2">(Disabled)</span>}
    </label>
    <div className="grid grid-cols-3 gap-2">
      {['Substitution', 'Insertion', 'Deletion'].map(t => (
        <button
          key={t}
          onClick={() => setMutationType(t)}
          disabled={isSickleCellMode}
          className={`p-2 rounded-lg font-semibold text-sm ${
            mutationType === t 
              ? 'bg-cyan-600 text-white' 
              : isSickleCellMode 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  </div>
</div>
            
           <div className="grid grid-cols-4 gap-3 mb-4">
  <button 
    onClick={generateMutations} 
    disabled={isSickleCellMode}
    className={`px-3 py-3 rounded-xl font-bold text-white text-sm leading-tight ${
      isSickleCellMode 
        ? 'bg-gray-600 cursor-not-allowed' 
        : 'bg-yellow-600 hover:bg-yellow-700'
    }`}
  >
    Generate<br/>Random
  </button>
  
  {/* ← ADD THIS SICKLE CELL BUTTON */}
  <button 
    onClick={() => applyPreset('sickle-cell')} 
    className={`px-3 py-3 rounded-xl font-bold text-white text-sm leading-tight ${
      isSickleCellMode 
        ? 'bg-green-600 hover:bg-green-700 ring-2 ring-yellow-400' 
        : 'bg-orange-600 hover:bg-orange-700'
    }`}
  >
    {isSickleCellMode ? '✓ Active' : 'Sickle Cell'}<br/>{isSickleCellMode ? 'Mode' : 'Anemia'}
  </button>
  
  <button 
    onClick={() => { 
      if (mutatedSeq !== sequence) { 
        setShow3D(true);
        sounds.playSuccess(); 
      }
    }} 
    className="bg-green-600 hover:bg-green-700 px-3 py-3 rounded-xl font-bold text-white text-sm leading-tight"
  >
    Show<br/>in 3D
  </button>
  
  
</div>
              <button 
  onClick={() => { 
    setMutatedSeq(sequence); 
    setMutationLog([]); 
    setShowComparison(false); 
    setShow3D(false); 
    setMutatedPositions([]);
    setIsSickleCellMode(false); // ← ADD THIS
    sounds.playClick(); 
  }} 
  className="bg-red-600 hover:bg-red-700 px-3 py-3 rounded-xl font-bold text-white text-sm leading-tight"
>
  Reset
</button>
            </div>
            
            {showComparison && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/30 rounded-xl p-3 border border-green-500">
                    <div className="text-green-300 text-xs mb-2 font-bold">Original DNA</div>
                    <div className="text-white font-mono text-sm break-all mb-2">{sequence}</div>
                    <div className="text-xs text-gray-400">
                      Length: {originalStats.length} bp | GC: {originalStats.gcContent}%
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-red-500">
                    <div className="text-red-300 text-xs mb-2 font-bold">Mutated DNA</div>
                    <div className="text-white font-mono text-sm break-all mb-2">{mutatedSeq}</div>
                    <div className="text-xs text-gray-400">
                      Length: {mutatedStats.length} bp | GC: {mutatedStats.gcContent}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-xl p-4 border border-blue-500 mb-4">
                  <h4 className="text-blue-300 font-bold mb-2">Impact Analysis</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                    <div className="bg-gray-800/50 p-3 rounded">
                      <div className="text-gray-400">Length Change</div>
                      <div className="text-white font-bold">{mutatedStats.length - originalStats.length > 0 ? '+' : ''}{mutatedStats.length - originalStats.length} bp</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded">
                      <div className="text-gray-400">GC Change</div>
                      <div className="text-white font-bold">{(mutatedStats.gcContent - originalStats.gcContent).toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded">
                      <div className="text-gray-400">Mutations</div>
                      <div className="text-white font-bold">{mutationLog.length}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-purple-500/50 mb-3">
                    <h5 className="text-purple-300 font-bold text-sm mb-2">mRNA Transcription</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-green-300 font-semibold mb-1">Original mRNA:</div>
                        <div className="font-mono bg-gray-900 p-2 rounded text-green-200 break-all">
                          {originalStats.mrna}
                        </div>
                      </div>
                      <div>
                        <div className="text-red-300 font-semibold mb-1">Mutated mRNA:</div>
                        <div className="font-mono bg-gray-900 p-2 rounded text-red-200 break-all">
                          {mutatedStats.mrna}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-purple-500/50">
                    <h5 className="text-purple-300 font-bold text-sm mb-2">Protein Translation</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-green-300 font-semibold mb-1">Original Protein:</div>
                        <div className="font-mono bg-gray-900 p-2 rounded text-green-200 break-all">
                          {originalStats.protein.join('-')}
                        </div>
                      </div>
                      <div>
                        <div className="text-red-300 font-semibold mb-1">Mutated Protein:</div>
                        <div className="font-mono bg-gray-900 p-2 rounded text-red-200 break-all">
                          {mutatedStats.protein.join('-')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      {originalStats.protein.join('-') === mutatedStats.protein.join('-') ? (
                        <div className="text-yellow-300 bg-yellow-900/30 p-2 rounded">
                          ⚠️ Silent mutation - No amino acid change
                        </div>
                      ) : mutatedStats.protein.includes('STOP') && !originalStats.protein.includes('STOP') ? (
                        <div className="text-red-300 bg-red-900/30 p-2 rounded">
                          🛑 Nonsense mutation - Premature STOP codon
                        </div>
                      ) : (
                        <div className="text-orange-300 bg-orange-900/30 p-2 rounded">
                          🔄 Missense mutation - Amino acid sequence changed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="bg-black/30 rounded-xl p-4 border border-yellow-500">
              <h4 className="text-yellow-300 font-bold mb-2">Mutation Log</h4>
              {mutationLog.length === 0 ? (
                <p className="text-gray-400 text-sm">No mutations generated yet</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {mutationLog.map((l, i) => (
                    <div key={i} className="text-white text-sm bg-gray-800/50 p-2 rounded">{l}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        
          <button onClick={onExit} className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl text-white font-bold">Back to Explorer</button>
        </div>
      </div>
      
      <div className="w-1/2 relative bg-gray-950">
        {show3D && mutatedSeq ? (
          <>
            <div className="absolute top-4 left-4 right-4 bg-cyan-900/90 px-4 py-3 rounded-lg z-10 border-2 border-cyan-500 pointer-events-none">
              <p className="text-cyan-100 text-sm font-bold text-center">Mutated DNA 3D Structure</p>
              <p className="text-cyan-300 text-xs text-center mt-1">Drag to rotate, scroll to zoom</p>
            </div>
            <div ref={containerRef} className="w-full h-full"/>
            <DNAScene seq={mutatedSeq} containerRef={containerRef} mutatedPositions={mutatedPositions}/>
            <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
              <span className="text-cyan-300 text-sm font-semibold">
                Mutated Length: <span className="text-white">{mutatedSeq.length}</span> bp
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">⚗️</div>
              <p className="text-xl font-semibold">Generate Mutation</p>
              <p className="text-sm mt-2">Create a mutation and click</p>
              <p className="text-sm text-cyan-400">"Show in 3D" to visualize</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DNABuilder({ onSequenceBuilt, onExit, sounds }) {
  const [basePairs, setBasePairs] = useState(Array(12).fill(null).map(() => ({ top: null, bottom: null, bonds: 0, validated: false })));
  const [draggedItem, setDraggedItem] = useState(null);
  const [previewSeq, setPreviewSeq] = useState('');
  const [show3D, setShow3D] = useState(false);
  const [currentStep, setCurrentStep] = useState('Add top base');
  const containerRef = useRef();
  const bases = ['A', 'T', 'G', 'C'];
  
  const getCorrectHydrogenBonds = (top, bottom) => {
    if (!top || !bottom) return 0;
    if ((top === 'A' && bottom === 'T') || (top === 'T' && bottom === 'A')) return 2;
    if ((top === 'G' && bottom === 'C') || (top === 'C' && bottom === 'G')) return 3;
    return -1;
  };
  
  const handleDragStart = (e, item, type) => { 
    setDraggedItem({ item, type }); 
  };
  
  const handleDragOver = (e) => { 
    e.preventDefault(); 
  };
  
  const findFirstIncompleteIndex = () => {
    for (let i = 0; i < basePairs.length; i++) {
      if (!basePairs[i].validated) return i;
    }
    return -1;
  };

  const handleBaseDrop = (e, pairIndex, position) => {
    e.preventDefault();
    if (draggedItem && draggedItem.type === 'base') {
      const firstIncomplete = findFirstIncompleteIndex();
      
      if (firstIncomplete !== -1 && pairIndex !== firstIncomplete) {
        sounds.playError();
        setCurrentStep(`Complete position ${firstIncomplete + 1} first!`);
        setDraggedItem(null);
        return;
      }
      
      sounds.playClick();
      const newPairs = [...basePairs];
      const pair = newPairs[pairIndex];
      
      if (position === 'top') {
        pair.top = draggedItem.item;
        pair.bottom = null;
        pair.bonds = 0;
        pair.validated = false;
        setCurrentStep('Now add complementary bottom base');
      } else if (position === 'bottom') {
        if (!pair.top) {
          sounds.playError();
          setCurrentStep('Add top base first!');
          setDraggedItem(null);
          return;
        }
        
        const correctComplement = BASE_PAIRS[pair.top].complement;
        if (draggedItem.item !== correctComplement) {
          sounds.playError();
          setCurrentStep(`Wrong! ${pair.top} pairs with ${correctComplement}, not ${draggedItem.item}`);
          setDraggedItem(null);
          return;
        }
        
        pair.bottom = draggedItem.item;
        pair.bonds = 0;
        pair.validated = false;
        const correctBonds = getCorrectHydrogenBonds(pair.top, pair.bottom);
        setCurrentStep(`Perfect! Now add ${correctBonds} hydrogen bonds`);
      }
      
      setBasePairs(newPairs);
      setDraggedItem(null);
    }
  };
  
  const handleBondDrop = (e, pairIndex) => {
    e.preventDefault();
    if (draggedItem && draggedItem.type === 'bond') {
      const firstIncomplete = findFirstIncompleteIndex();
      
      if (firstIncomplete !== -1 && pairIndex !== firstIncomplete) {
        sounds.playError();
        setCurrentStep(`Complete position ${firstIncomplete + 1} first!`);
        setDraggedItem(null);
        return;
      }
      
      const newPairs = [...basePairs];
      const pair = newPairs[pairIndex];
      
      if (!pair.top || !pair.bottom) {
        sounds.playError();
        setCurrentStep('Add both bases first!');
        setDraggedItem(null);
        return;
      }
      
      const correctBonds = getCorrectHydrogenBonds(pair.top, pair.bottom);
      
      if (correctBonds === -1) {
        sounds.playError();
        setCurrentStep('Fix base pairing first!');
        setDraggedItem(null);
        return;
      }
      
      if (pair.bonds < correctBonds) {
        pair.bonds += 1;
        sounds.playClick();
        
        if (pair.bonds === correctBonds) {
          sounds.playSuccess();
          pair.validated = true;
          
          const nextIncomplete = findFirstIncompleteIndex();
          if (nextIncomplete === -1) {
            setCurrentStep('All pairs complete! Click Validate 3D');
          } else {
            setCurrentStep(`Great! Now build position ${nextIncomplete + 1}`);
          }
        } else {
          setCurrentStep(`Good! Add ${correctBonds - pair.bonds} more bond(s)`);
        }
      } else {
        sounds.playError();
        setCurrentStep(`Too many! ${pair.top}-${pair.bottom} needs only ${correctBonds} bonds`);
      }
      
      setBasePairs(newPairs);
      setDraggedItem(null);
    }
  };
  
  const validateAndApply = () => {
    const errors = [];
    let validCount = 0;
    
    basePairs.forEach((pair, idx) => {
      if (pair.top && pair.bottom) {
        const correctBonds = getCorrectHydrogenBonds(pair.top, pair.bottom);
        if (correctBonds === -1) {
          errors.push(`Position ${idx + 1}: ${pair.top}-${pair.bottom} invalid pairing`);
        } else if (pair.bonds !== correctBonds) {
          errors.push(`Position ${idx + 1}: needs ${correctBonds} H-bonds, has ${pair.bonds}`);
        } else {
          validCount++;
        }
      }
    });
    
    if (validCount === 0) {
      alert("Add at least one complete base pair!");
      sounds.playError();
      return;
    }
    
    if (errors.length > 0) {
      alert("Validation Errors:\n\n" + errors.join('\n'));
      sounds.playError();
      return;
    }
    
    const sequence = basePairs.map(p => p.top || '').join('').replace(/\s+$/, '');
    if (sequence.length > 0) {
      setPreviewSeq(sequence);
      setShow3D(true);
      sounds.playSuccess();
      setCurrentStep('Success! Apply to explorer');
    }
  };
  
  const applyToMain = () => {
    if (previewSeq && previewSeq.length > 0) {
      onSequenceBuilt(previewSeq);
    }
  };
  
  const clearAll = () => {
    sounds.playClick();
    setBasePairs(Array(12).fill(null).map(() => ({ top: null, bottom: null, bonds: 0, validated: false })));
    setShow3D(false);
    setPreviewSeq('');
    setCurrentStep('Add top base');
  };
  
  return (
    <div className="w-full h-full flex bg-gray-900">
      <div className="w-1/2 p-4 overflow-y-auto border-r border-cyan-500/30">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-gray-800 p-4 rounded-xl border-2 border-purple-500">
            <h3 className="text-xl font-bold text-purple-300 mb-3 text-center">Build DNA Strand</h3>
            
            <div className="bg-blue-900/50 border-2 border-blue-500 rounded-lg p-3 mb-4">
              <p className="text-blue-200 text-sm font-bold mb-2">Instructions:</p>
              <ol className="text-blue-100 text-xs space-y-1 list-decimal list-inside">
                <li>Drag a base (A, T, G, C) to the top strand</li>
                <li>Drag the complementary base to bottom (A↔T, G↔C)</li>
                <li>Drag H-bonds: 2 for A-T pairs, 3 for G-C pairs</li>
                <li>Repeat for more pairs, then click Validate</li>
              </ol>
            </div>
            
            <div className={`bg-gradient-to-r ${currentStep.includes('!') || currentStep.includes('Wrong') || currentStep.includes('Too many') || currentStep.includes('Fix') ? 'from-red-900 to-red-800' : currentStep.includes('Perfect') || currentStep.includes('Great') || currentStep.includes('Success') ? 'from-green-900 to-green-800' : 'from-cyan-900 to-cyan-800'} border-2 border-cyan-400 rounded-lg p-3 mb-4 text-center`}>
              <p className="text-white font-bold text-sm">{currentStep}</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-3 mb-3">
              <div className="flex gap-3 justify-center items-center">
                <div className="flex-1">
                  <p className="text-center text-gray-300 text-xs mb-2 font-semibold">Drag Bases:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {bases.map(base => (
                      <div key={base} draggable="true" onDragStart={(e) => handleDragStart(e, base, 'base')}
                        className="h-12 rounded-lg font-bold text-xl flex items-center justify-center cursor-move hover:scale-105 border-2 border-white/30 transition-transform"
                        style={{ backgroundColor: base === 'A' ? '#FF6B35' : base === 'T' ? '#FF1493' : base === 'G' ? '#4169E1' : '#32CD32', color: 'white' }}>
                        {base}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="w-px bg-gray-600 h-12"></div>
                
                <div>
                  <p className="text-center text-gray-300 text-xs mb-2 font-semibold">H-Bond:</p>
                  <div draggable="true" onDragStart={(e) => handleDragStart(e, 'H', 'bond')}
                    className="h-12 w-16 rounded-lg flex items-center justify-center cursor-move hover:scale-105 border-2 border-cyan-400 bg-cyan-600/80 transition-transform"
                    style={{ touchAction: 'none' }}>
                    <div className="w-1.5 h-8 bg-white rounded-sm"></div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center">
                A↔T (2) | G↔C (3)
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl border-4 border-orange-500 p-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-2xl font-bold text-yellow-400">5'</span>
              <span className="text-2xl font-bold text-green-400">3'</span>
            </div>
            <div className="bg-orange-500 h-3 rounded-t"></div>
            
            <div className="flex bg-gray-800">
              {basePairs.map((pair, idx) => (
                <div key={`top-${idx}`} onDragOver={handleDragOver} onDrop={(e) => handleBaseDrop(e, idx, 'top')}
                  className={`flex-1 h-14 flex items-center justify-center text-xl font-bold border-r border-gray-700 last:border-r-0 transition-all ${pair.validated ? 'ring-2 ring-green-400' : ''}`}
                  style={{ backgroundColor: pair.top ? (pair.top === 'A' ? '#FF6B35' : pair.top === 'T' ? '#FF1493' : pair.top === 'G' ? '#4169E1' : '#32CD32') : '#2D3748', color: 'white' }}>
                  {pair.top || ''}
                </div>
              ))}
            </div>
            
            <div className="flex bg-gray-800 border-y-2 border-gray-700">
              {basePairs.map((pair, idx) => (
                <div key={`bond-${idx}`} onDragOver={handleDragOver} onDrop={(e) => handleBondDrop(e, idx)}
                  className="flex-1 h-10 flex items-center justify-center border-r border-gray-700 last:border-r-0">
                  <div className="flex gap-0.5">
                    {pair.bonds > 0 ? [...Array(pair.bonds)].map((_, i) => {
                      const correctBonds = getCorrectHydrogenBonds(pair.top, pair.bottom);
                      const isCorrect = pair.bonds <= correctBonds;
                      return (
                        <div key={i} className={`w-1 h-6 rounded-sm ${isCorrect ? 'bg-white' : 'bg-red-500'}`}></div>
                      );
                    }) : (
                      <div className="w-0.5 h-6 bg-gray-600 rounded-sm"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex bg-gray-800">
              {basePairs.map((pair, idx) => (
                <div key={`bottom-${idx}`} onDragOver={handleDragOver} onDrop={(e) => handleBaseDrop(e, idx, 'bottom')}
                  className={`flex-1 h-14 flex items-center justify-center text-xl font-bold border-r border-gray-700 last:border-r-0 transition-all ${pair.validated ? 'ring-2 ring-green-400' : ''}`}
                  style={{ backgroundColor: pair.bottom ? (pair.bottom === 'A' ? '#FF6B35' : pair.bottom === 'T' ? '#FF1493' : pair.bottom === 'G' ? '#4169E1' : '#32CD32') : '#2D3748', color: 'white' }}>
                  {pair.bottom || ''}
                </div>
              ))}
            </div>
            
            <div className="bg-orange-500 h-3 rounded-b"></div>
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-2xl font-bold text-green-400">3'</span>
              <span className="text-2xl font-bold text-yellow-400">5'</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={clearAll} className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-bold text-white">Clear All</button>
            <button onClick={onExit} className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-bold text-white">Exit Builder</button>
            <button onClick={validateAndApply} className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-bold text-white">Validate 3D</button>
          </div>
          {show3D && previewSeq && (
            <button onClick={applyToMain} className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-bold text-white">
              Apply to Main Explorer
            </button>
          )}
        </div>
      </div>
      
      <div className="w-1/2 relative bg-gray-950">
        <div className="absolute top-4 left-4 right-4 bg-cyan-900/90 px-4 py-3 rounded-lg z-10 border-2 border-cyan-500 pointer-events-none">
          <p className="text-cyan-100 text-sm font-bold text-center">3D Preview</p>
          <p className="text-cyan-300 text-xs text-center mt-1">{show3D ? 'Drag to rotate, scroll to zoom' : 'Click "Validate 3D" to preview'}</p>
        </div>
        <div className="w-full h-full flex items-center justify-center">
          {show3D && previewSeq && previewSeq.length > 0 ? (
            <>
              <div ref={containerRef} className="w-full h-full absolute inset-0"/>
              <DNAScene seq={previewSeq} containerRef={containerRef}/>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🧬</div>
              <p className="text-xl font-semibold">Build Your DNA</p>
              <p className="text-sm mt-2">1. Drag bases to top strand</p>
              <p className="text-sm">2. Add complementary bases below</p>
              <p className="text-sm">3. Add hydrogen bonds</p>
              <p className="text-sm mt-2 text-cyan-400">Click "Validate 3D" to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameMode({ onExitGame, sounds }) {
  const [difficulty, setDifficulty] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [cur, setCur] = useState(null);
  const [ans, setAns] = useState('');
  const [fb, setFb] = useState('');
  const [time, setTime] = useState(120);
  const [active, setActive] = useState(false);
  const [hints, setHints] = useState(3);
  const [lives, setLives] = useState(5);
  const [highScore, setHighScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [answerType, setAnswerType] = useState('text');
  const [choices, setChoices] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);

  const questions = {
    easy: [
      {q:'Complementary base for A?', a:'T', p:10, hint:'Starts with T', expl:'Adenine pairs with Thymine via 2 H-bonds'},
      {q:'Complementary base for G?', a:'C', p:10, hint:'Starts with C', expl:'Guanine pairs with Cytosine via 3 H-bonds'},
      {q:'H-bonds between A-T?', a:'2', p:15, hint:'Less than 3', expl:'A-T pairs have 2 hydrogen bonds'},
      {q:'H-bonds between G-C?', a:'3', p:15, hint:'More than 2', expl:'G-C pairs have 3 hydrogen bonds'},
      {q:'Which is stronger?', a:'G-C', p:20, choices:['A-T','G-C','Equal','Neither'], hint:'More bonds', expl:'G-C has 3 bonds vs A-T with 2'}
    ],
    medium: [
      {q:'Adenine has how many rings?', a:'2', p:25, hint:'Purine', expl:'Purines have 2 rings, Pyrimidines have 1'},
      {q:'Is Adenine a Purine or Pyrimidine?', a:'Purine', p:25, choices:['Purine','Pyrimidine'], hint:'2 rings', expl:'Purines have double ring structure'},
      {q:'Thymine has how many rings?', a:'1', p:25, hint:'Pyrimidine', expl:'Pyrimidines have single ring'},
      {q:'DNA stands for?', a:'Deoxyribonucleic Acid', p:30, hint:'Deoxy...', expl:'Deoxyribonucleic Acid'},
      {q:'Who discovered DNA structure?', a:'Watson', p:35, choices:['Darwin','Watson','Mendel','Einstein'], hint:'With Crick', expl:'Watson and Crick in 1953'},
      {q:'Year DNA discovered?', a:'1953', p:35, hint:'1950s', expl:'Published in 1953'}
    ],
    hard: [
      {q:'Which base replaces Thymine in RNA?', a:'Uracil', p:40, hint:'Starts with U', expl:'RNA uses Uracil not Thymine'},
      {q:'DNA polymerase reads which direction?', a:'3-5', p:45, choices:['5-3','3-5'], hint:'Opposite synthesis', expl:'Reads 3-5, synthesizes 5-3'},
      {q:'What protects chromosome ends?', a:'Telomeres', p:40, hint:'Telo...', expl:'Telomeres protect chromosome ends'},
      {q:'Formula for Adenine?', a:'C5H5N5', p:50, hint:'5 nitrogens', expl:'Adenine is C5H5N5'},
      {q:'Histone proteins do what?', a:'Package', p:45, choices:['Package','Replicate','Destroy','Translate'], hint:'DNA wraps', expl:'Package DNA'},
      {q:'Mutation changing one base?', a:'Point', p:50, choices:['Point','Frameshift','Insertion','Deletion'], hint:'Single', expl:'Point mutation'}
    ]
  };

  useEffect(() => { 
    if (!active || time <= 0) return; 
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        setActive(false);
        if (score > highScore) setHighScore(score);
        return 0;
      }
      return p - 1;
    }), 1000); 
    return () => clearInterval(t); 
  }, [active, time, score, highScore]);

  const next = () => { 
    if (!difficulty) return;
    const qs = questions[difficulty];
    
    const availableQuestions = qs.filter((q, idx) => !usedQuestions.includes(idx));
    
    if (availableQuestions.length === 0) {
      setActive(false);
      if (score > highScore) setHighScore(score);
      return;
    }
    
    const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const qIndex = qs.indexOf(selectedQuestion);
    setUsedQuestions(prev => [...prev, qIndex]);
    
    setCur({...selectedQuestion, s: Date.now()}); 
    setAns(''); 
    setFb(''); 
    setShowHint(false);
    
    if (selectedQuestion.choices) {
      setAnswerType('choice');
      setChoices(selectedQuestion.choices);
    } else {
      setAnswerType('text');
      setChoices([]);
    }
  };

  const start = (diff) => { 
    sounds.playClick(); 
    setDifficulty(diff);
    setHints(diff === 'easy' ? 5 : diff === 'medium' ? 3 : 2);
    setLives(diff === 'easy' ? 5 : diff === 'medium' ? 3 : 1);
    setAchievements([]);
    setScore(0); 
    setCombo(0); 
    setTime(120);
    setActive(true);
    setUsedQuestions([]);
    
    const qs = questions[diff];
    const q = qs[Math.floor(Math.random() * qs.length)]; 
    const qIndex = qs.indexOf(q);
    setUsedQuestions([qIndex]);
    setCur({...q, s: Date.now()}); 
    setAns(''); 
    setFb(''); 
    setShowHint(false);
    if (q.choices) {
      setAnswerType('choice');
      setChoices(q.choices);
    } else {
      setAnswerType('text');
      setChoices([]);
    }
  };

  const useHint = () => {
    if (hints > 0 && cur) {
      setHints(hints - 1);
      setShowHint(true);
      sounds.playClick();
    }
  };

  const checkAchievements = (newScore, newCombo) => {
    const newAch = [];
    if (newCombo === 5 && !achievements.includes('5-Combo!')) newAch.push('5-Combo!');
    if (newCombo === 10 && !achievements.includes('10-Combo!')) newAch.push('10-Combo!');
    if (newScore >= 500 && !achievements.includes('Score 500!')) newAch.push('Score 500!');
    if (newAch.length > 0) {
      setAchievements(prev => [...prev, ...newAch]);
      sounds.playCombo(10);
    }
  };

  const check = (answer = ans) => { 
    if (!cur || !active) return; 
    const t = (Date.now() - cur.s) / 1000;
    const ok = answer.toUpperCase().trim() === cur.a.toUpperCase(); 
    
    if (ok) { 
      sounds.playSuccess();
      const newCombo = combo + 1;
      const comboBonus = newCombo * 5;
      const speedBonus = t < 5 ? 15 : t < 10 ? 10 : 0;
      const diffMult = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
      const pts = Math.floor((cur.p + comboBonus + speedBonus) * diffMult); 
      const newScore = score + pts;
      
      setScore(newScore); 
      setCombo(newCombo); 
      setFb(`Correct! +${pts}${speedBonus > 0 ? ' (Speed!)' : ''}`); 
      sounds.playCombo(newCombo);
      
      checkAchievements(newScore, newCombo);
      setTimeout(next, 1800); 
    } else { 
      sounds.playError(); 
      const newLives = lives - 1;
      setLives(newLives);
      setCombo(0); 
      setFb(`Wrong! Answer: ${cur.a}\n${cur.expl}`); 
      
      if (newLives <= 0) {
        setActive(false);
        if (score > highScore) setHighScore(score);
        setFb(`Level Complete!\nFinal Score: ${score}`);
      } else {
        setTimeout(next, 2500);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900 overflow-y-auto">
      <div className="w-full max-w-3xl space-y-4">
        <div className="bg-purple-900 p-6 rounded-xl border-2 border-purple-500">
          <h3 className="text-3xl font-bold text-yellow-300 mb-4 text-center">DNA Challenge</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-yellow-300 text-xs">Score</div>
              <div className="text-3xl font-bold text-yellow-300">{score}</div>
              {highScore > 0 && <div className="text-xs text-gray-400">Best: {highScore}</div>}
            </div>
            {combo > 0 && <div className="bg-black/30 rounded-xl p-3">
              <div className="text-orange-300 text-xs">Combo</div>
              <div className="text-3xl font-bold text-orange-300">{combo}x</div>
            </div>}
            {active && <div className="bg-black/30 rounded-xl p-3">
              <div className="text-red-300 text-xs">Lives</div>
              <div className="text-2xl">{Array(lives).fill('❤️').join('')}</div>
            </div>}
          </div>
        </div>

        {active && <div className="bg-red-900 p-4 rounded-xl border-2 border-red-500">
          <div className="flex justify-between mb-2">
            <span className="text-xl font-bold text-white">Time</span>
            <span className="text-4xl font-bold text-white">{time}s</span>
          </div>
          <div className="w-full bg-gray-900 h-4 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all" 
              style={{width:`${(time/120)*100}%`}}/>
          </div>
        </div>}

        {achievements.length > 0 && <div className="bg-yellow-900 p-3 rounded-xl border-2 border-yellow-500">
          <h4 className="font-bold text-yellow-200 mb-2">Achievements</h4>
          {achievements.map((ach, i) => <div key={i} className="text-white text-sm">{ach}</div>)}
        </div>}

        {!active && !difficulty ? (
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-xl border-2 border-cyan-500">
              <h4 className="text-xl font-bold text-cyan-300 mb-4 text-center">Select Difficulty</h4>
              <div className="space-y-3">
                <button onClick={() => start('easy')} className="w-full bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl text-white font-bold text-lg">
                  Easy - 5 Lives, 5 Hints
                </button>
                <button onClick={() => start('medium')} className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-4 rounded-xl text-white font-bold text-lg">
                  Medium - 3 Lives, 3 Hints
                </button>
                <button onClick={() => start('hard')} className="w-full bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl text-white font-bold text-lg">
                  Hard - 1 Life, 2 Hints
                </button>
              </div>
            </div>
            <button onClick={onExitGame} className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl text-white font-bold">Back to Explorer</button>
          </div>
        ) : !active && difficulty ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-8 rounded-xl border-4 border-yellow-400">
              <h3 className="text-3xl font-bold text-yellow-300 mb-4 text-center">Level Complete!</h3>
              <div className="bg-black/30 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">🎉</div>
                  <p className="text-white text-2xl font-bold">Final Score: {score}</p>
                  {highScore > 0 && score >= highScore && (
                    <p className="text-yellow-300 text-lg mt-2">New High Score! 🏆</p>
                  )}
                </div>
                {achievements.length > 0 && (
                  <div className="bg-yellow-900/50 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-yellow-200 mb-2">Achievements Unlocked:</h4>
                    {achievements.map((ach, i) => (
                      <div key={i} className="text-white text-sm">✨ {ach}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => {
                  const nextLevel = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : null;
                  if (nextLevel) {
                    start(nextLevel);
                  }
                }} 
                disabled={difficulty === 'hard'}
                className={`px-6 py-4 rounded-xl font-bold text-white text-lg ${difficulty === 'hard' ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                  {difficulty === 'easy' ? 'Next: Medium' : difficulty === 'medium' ? 'Next: Hard' : 'Max Level!'}
                </button>
                <button onClick={onExitGame} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-4 rounded-xl font-bold text-white text-lg">
                  Exit to Explorer
                </button>
              </div>
              <button onClick={() => start(difficulty)} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-xl font-bold text-white text-lg">
                Retry {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            </div>
          </div>
        ) : active && cur ? (
          <>
            <div className="bg-purple-900 p-6 rounded-xl border-4 border-cyan-400">
              <p className="text-xl mb-4 text-white font-semibold bg-black/30 p-4 rounded-xl">{cur.q}</p>
              {answerType === 'choice' ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {choices.map((choice, i) => (
                    <button key={i} onClick={() => check(choice)} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-3 rounded-xl text-white font-bold">
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    value={ans} 
                    onChange={e => setAns(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && check()} 
                    placeholder="Type answer..." 
                    autoFocus 
                    className="bg-gray-900 text-white px-5 py-4 rounded-xl w-full text-lg border-4 border-cyan-500 mb-4"
                  />
                  <button onClick={() => check()} className="bg-cyan-600 hover:bg-cyan-700 px-8 py-4 rounded-xl text-xl font-bold w-full text-white mb-4">
                    Submit
                  </button>
                </>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={useHint} 
                  disabled={hints === 0} 
                  className={`flex-1 px-4 py-3 rounded-xl font-bold ${hints > 0 ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-600 cursor-not-allowed text-gray-400'}`}
                >
                  Hint ({hints})
                </button>
                <button onClick={onExitGame} className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl text-white font-bold">
                  Exit
                </button>
              </div>
              {showHint && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-900 border-2 border-yellow-500 text-yellow-100 font-semibold">
                  {cur.hint}
                </div>
              )}
{fb && (
                <div className={`mt-4 p-5 rounded-xl text-center font-bold ${fb.includes('Correct') ? 'bg-green-600' : 'bg-red-600'} text-white whitespace-pre-line`}>
                  {fb}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DNAScene({seq, containerRef, mutatedPositions = []
}) {
  const scRef = useRef();
  const rendRef = useRef();
  const animRef = useRef();
  const meshRef = useRef([]);
  const cameraRef = useRef();
  const mutatedMeshesRef = useRef([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x0a0a1a);
    scRef.current = sc;
    
    const cam = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    cam.position.set(0, 0, 15);
    cameraRef.current = cam;
    
    const rend = new THREE.WebGLRenderer({antialias: true});
    rend.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    rendRef.current = rend;
    containerRef.current.appendChild(rend.domElement);
    
    sc.add(new THREE.AmbientLight(0x404040, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(10, 10, 10);
    sc.add(dl);
    
    const controls = {
      isDragging: false,
      previousMousePosition: {x: 0, y: 0},
      rotation: {x: 0, y: 0},
      targetRotation: {x: 0, y: 0},
      distance: 15,
      targetDistance: 15
    };
    
    const onMouseDown = (e) => {
      if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
      controls.isDragging = true;
      controls.previousMousePosition = {x: e.clientX, y: e.clientY};
    };
    
    const onMouseUp = (e) => {
      controls.isDragging = false;
    };
    
    const onMouseMove = (e) => {
      if (!controls.isDragging) return;
      if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
      if (!controls.previousMousePosition) return;
      
      const deltaX = e.clientX - controls.previousMousePosition.x;
      const deltaY = e.clientY - controls.previousMousePosition.y;
      
      controls.targetRotation.y += deltaX * 0.005;
      controls.targetRotation.x += deltaY * 0.005;
      
      controls.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.targetRotation.x));
      
      controls.previousMousePosition = {x: e.clientX, y: e.clientY};
    };
    
    const onWheel = (e) => {
      if (!e) return;
      e.preventDefault();
      controls.targetDistance += e.deltaY * 0.01;
      controls.targetDistance = Math.max(5, Math.min(30, controls.targetDistance));
    };
    
    const canvas = rend.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, {passive: false});
    
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      
      if (!controls || !controls.rotation) return;
      
      controls.rotation.x += (controls.targetRotation.x - controls.rotation.x) * 0.1;
      controls.rotation.y += (controls.targetRotation.y - controls.rotation.y) * 0.1;
      controls.distance += (controls.targetDistance - controls.distance) * 0.1;
      
      cam.position.x = Math.sin(controls.rotation.y) * Math.cos(controls.rotation.x) * controls.distance;
      cam.position.y = Math.sin(controls.rotation.x) * controls.distance;
      cam.position.z = Math.cos(controls.rotation.y) * Math.cos(controls.rotation.x) * controls.distance;
      cam.lookAt(0, 0, 0);
      
      const time = Date.now() * 0.003;
      mutatedMeshesRef.current.forEach(mesh => {
        if (mesh && mesh.material && mesh.userData.isMutated) {
          const pulse = Math.sin(time + mesh.userData.pulsePhase) * 0.5 + 0.5;
          mesh.material.emissiveIntensity = pulse * 0.8 + 0.2;
          mesh.scale.set(1 + pulse * 0.2, 1 + pulse * 0.2, 1 + pulse * 0.2);
        }
      });
      
      rend.render(sc, cam);
    };
    animate();
    
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (container && rend.domElement && container.contains(rend.domElement)) {
      container.removeChild(rend.domElement);
    }
    rend.dispose();
  };
}, []); 
  
  useEffect(() => {
    if (!scRef.current || !cameraRef.current) return;
    if (!seq || seq.length === 0) return;
    
    meshRef.current.forEach(m => scRef.current.remove(m));
    meshRef.current = [];
    mutatedMeshesRef.current = [];
    
    const grp = new THREE.Group();
    const n = seq.length;
    const h = n * 0.34;
    const r = 1.0;
    const angleStep = (2 * Math.PI) / 10.4;
    const bb1 = [], bb2 = [];
    
    const createTextSprite = (text, color) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      context.font = 'Bold 72px monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.lineWidth = 6;
      context.strokeText(text, 64, 64);
      context.fillStyle = 'white';
      context.fillText(text, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({map: texture});
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.35, 0.35, 1);
      
      return sprite;
    };
    
    const createEndLabel = (text, color) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 80;
      canvas.height = 40;
      
      context.font = 'Bold 24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.lineWidth = 3;
      context.strokeText(text, 40, 20);
      context.fillStyle = color;
      context.fillText(text, 40, 20);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.8, 0.4, 1);
      
      return sprite;
    };
    
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep;
      const y = (i * h / n) - h / 2;
      const x1 = Math.cos(angle) * r;
      const z1 = Math.sin(angle) * r;
      const x2 = Math.cos(angle + Math.PI) * r;
      const z2 = Math.sin(angle + Math.PI) * r;
      
      bb1.push(new THREE.Vector3(x1, y, z1));
      bb2.push(new THREE.Vector3(x2, y, z2));
      
      const base1 = seq[i];
      const base2 = BASE_PAIRS[base1]?.complement || 'N';
      const baseGeom = new THREE.BoxGeometry(0.16, 0.08, 0.8);
      
      const isMutated = mutatedPositions.includes(i);
      
      const mesh1 = new THREE.Mesh(
        baseGeom,
        new THREE.MeshStandardMaterial({
          color: BASE_COLORS[base1] || 0xcccccc,
          emissive: isMutated ? BASE_COLORS[base1] || 0xcccccc : 0x000000,
          emissiveIntensity: isMutated ? 0.5 : 0
        })
      );
      const baseX1 = x1 * 0.7;
      const baseZ1 = z1 * 0.7;
      mesh1.position.set(baseX1, y, baseZ1);
      mesh1.rotation.y = Math.atan2(-baseX1, -baseZ1);
      mesh1.userData.isMutated = isMutated;
      mesh1.userData.pulsePhase = Math.random() * Math.PI * 2;
      grp.add(mesh1);
      
      if (isMutated) {
        mutatedMeshesRef.current.push(mesh1);
      }
      
      const label1 = createTextSprite(base1, '#ffffff');
      label1.position.set(baseX1, y + 0.08/2 + 0.1, baseZ1);
      grp.add(label1);
      
      const mesh2 = new THREE.Mesh(
        baseGeom,
        new THREE.MeshStandardMaterial({color: BASE_COLORS[base2] || 0xcccccc})
      );
      const baseX2 = x2 * 0.7;
      const baseZ2 = z2 * 0.7;
      mesh2.position.set(baseX2, y, baseZ2);
      mesh2.rotation.y = Math.atan2(-baseX2, -baseZ2);
      grp.add(mesh2);
      
      const label2 = createTextSprite(base2, '#ffffff');
      label2.position.set(baseX2, y + 0.08/2 + 0.1, baseZ2);
      grp.add(label2);
      
      const bondCount = BASE_PAIRS[base1]?.hBonds || 2;
      const innerX1 = x1 * 0.25;
      const innerZ1 = z1 * 0.25;
      const innerX2 = x2 * 0.25;
      const innerZ2 = z2 * 0.25;
      
      for (let j = 0; j < bondCount; j++) {
        const offset = (j - (bondCount - 1) / 2) * 0.04;
        const bondGeom = new THREE.BufferGeometry();
        const positions = [];
        
        for (let k = 0; k < 6; k += 2) {
          const t1 = k / 6;
          const t2 = (k + 1) / 6;
          positions.push(
            innerX1 + (innerX2 - innerX1) * t1, y + offset, innerZ1 + (innerZ2 - innerZ1) * t1,
            innerX1 + (innerX2 - innerX1) * t2, y + offset, innerZ1 + (innerZ2 - innerZ1) * t2
          );
        }
        
        bondGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        grp.add(new THREE.LineSegments(
          bondGeom,
          new THREE.LineBasicMaterial({color: 0x87CEEB})
        ));
      }
    }
    
    grp.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bb1), n * 2, 0.08, 8, false),
      new THREE.MeshStandardMaterial({color: 0xDD4444})
    ));
    grp.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bb2), n * 2, 0.08, 8, false),
      new THREE.MeshStandardMaterial({color: 0xDD4444})
    ));
    
    const topTip1 = bb1[0].clone();
    const bottomTip1 = bb1[bb1.length-1].clone();
    const topTip2 = bb2[0].clone();
    const bottomTip2 = bb2[bb2.length-1].clone();

    const topDirection1 = bb1.length > 1 ? 
      topTip1.clone().sub(bb1[1]).normalize().multiplyScalar(0.3) : 
      new THREE.Vector3(0, 0.3, 0);
    
    const bottomDirection1 = bb1.length > 1 ? 
      bottomTip1.clone().sub(bb1[bb1.length-2]).normalize().multiplyScalar(0.3) : 
      new THREE.Vector3(0, -0.3, 0);
    
    const topDirection2 = bb2.length > 1 ? 
      topTip2.clone().sub(bb2[1]).normalize().multiplyScalar(0.3) : 
      new THREE.Vector3(0, 0.3, 0);
    
    const bottomDirection2 = bb2.length > 1 ? 
      bottomTip2.clone().sub(bb2[bb2.length-2]).normalize().multiplyScalar(0.3) : 
      new THREE.Vector3(0, -0.3, 0);

    const label5_1 = createEndLabel("5'", '#FFD700');
    label5_1.position.copy(topTip1.clone().add(topDirection1));
    grp.add(label5_1);
    
    const label3_1 = createEndLabel("3'", '#32CD32');
    label3_1.position.copy(bottomTip1.clone().add(bottomDirection1));
    grp.add(label3_1);
    
    const label3_2 = createEndLabel("3'", '#32CD32');
    label3_2.position.copy(topTip2.clone().add(topDirection2));
    grp.add(label3_2);
    
    const label5_2 = createEndLabel("5'", '#FFD700');
    label5_2.position.copy(bottomTip2.clone().add(bottomDirection2));
    grp.add(label5_2);
    
    scRef.current.add(grp);
    meshRef.current.push(grp);
  }, [seq, mutatedPositions]);
  
  return null;
}

const ChemicalModal = ({base, onClose}) => {
  const info = {
    A: {name: 'Adenine', formula: 'C₅H₅N₅', type: 'Purine', rings: 2, bonds: 2, color: '#FFD700'},
    T: {name: 'Thymine', formula: 'C₅H₆N₂O₂', type: 'Pyrimidine', rings: 1, bonds: 2, color: '#90EE90'},
    G: {name: 'Guanine', formula: 'C₅H₅N₅O', type: 'Purine', rings: 2, bonds: 3, color: '#87CEEB'},
    C: {name: 'Cytosine', formula: 'C₄H₅N₃O', type: 'Pyrimidine', rings: 1, bonds: 3, color: '#FF69B4'}
  }[base];
  
  const structures = {
    A: (
      <svg viewBox="0 0 240 240" className="w-full h-full">
        <line x1="120" y1="140" x2="145" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="123" y1="143" x2="148" y2="128" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="145" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="95" x2="120" y2="80" stroke="#000" strokeWidth="3"/>
        <line x1="142" y1="92" x2="117" y2="77" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="95" x2="95" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="98" y1="95" x2="98" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="120" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="120" y2="50" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="50" x2="95" y2="65" stroke="#000" strokeWidth="3"/>
        <line x1="117" y1="53" x2="92" y2="68" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="65" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="70" y2="140" stroke="#000" strokeWidth="3"/>
        <text x="120" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="125" y="160" fontSize="11" fill="#0000FF">1</text>
        <text x="145" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="150" y="145" fontSize="11" fill="#333">2</text>
        <text x="145" y="90" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="150" y="105" fontSize="11" fill="#0000FF">3</text>
        <text x="120" y="75" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="125" y="65" fontSize="11" fill="#333">4</text>
        <text x="95" y="90" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="85" fontSize="11" fill="#333">5</text>
        <text x="95" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="135" fontSize="11" fill="#333">6</text>
        <text x="95" y="60" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="85" y="55" fontSize="11" fill="#0000FF">7</text>
        <text x="120" y="45" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="130" y="45" fontSize="11" fill="#0000FF">9</text>
        <text x="65" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">NH₂</text>
        <text x="120" y="30" fontSize="12" fill="#666" textAnchor="middle">↓ to ribose</text>
      </svg>
    ),
    T: (
      <svg viewBox="0 0 240 240" className="w-full h-full">
        <line x1="120" y1="140" x2="145" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="145" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="148" y1="125" x2="148" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="95" x2="120" y2="80" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="117" y1="83" x2="92" y2="98" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="95" x2="95" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="120" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="98" y1="125" x2="123" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="170" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="148" y1="128" x2="173" y2="143" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="120" y2="55" stroke="#000" strokeWidth="3"/>
        <line x1="123" y1="80" x2="123" y2="55" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="95" x2="70" y2="80" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="140" x2="120" y2="165" stroke="#000" strokeWidth="3"/>
        <text x="120" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="125" y="160" fontSize="11" fill="#0000FF">1</text>
        <text x="145" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="150" y="145" fontSize="11" fill="#333">2</text>
        <text x="145" y="90" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="150" y="105" fontSize="11" fill="#0000FF">3</text>
        <text x="120" y="75" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="125" y="65" fontSize="11" fill="#333">4</text>
        <text x="95" y="90" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="85" fontSize="11" fill="#333">5</text>
        <text x="95" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="135" fontSize="11" fill="#333">6</text>
        <text x="175" y="145" fontSize="16" fontWeight="bold" fill="#FF0000" textAnchor="middle">O</text>
        <text x="120" y="50" fontSize="16" fontWeight="bold" fill="#FF0000" textAnchor="middle">O</text>
        <text x="65" y="80" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">CH₃</text>
        <text x="120" y="180" fontSize="14" fill="#666" textAnchor="middle">H</text>
        <text x="120" y="195" fontSize="12" fill="#666" textAnchor="middle">↓ to ribose</text>
      </svg>
    ),
    G: (
      <svg viewBox="0 0 240 240" className="w-full h-full">
        <line x1="120" y1="140" x2="145" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="123" y1="143" x2="148" y2="128" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="145" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="95" x2="120" y2="80" stroke="#000" strokeWidth="3"/>
        <line x1="142" y1="92" x2="117" y2="77" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="95" x2="95" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="120" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="120" y2="50" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="50" x2="95" y2="65" stroke="#000" strokeWidth="3"/>
        <line x1="117" y1="53" x2="92" y2="68" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="65" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="70" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="92" y1="128" x2="67" y2="143" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="170" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="140" x2="120" y2="165" stroke="#000" strokeWidth="3"/>
        <text x="120" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="125" y="160" fontSize="11" fill="#0000FF">1</text>
        <text x="145" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="150" y="145" fontSize="11" fill="#333">2</text>
        <text x="145" y="90" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="150" y="105" fontSize="11" fill="#0000FF">3</text>
        <text x="120" y="75" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="125" y="65" fontSize="11" fill="#333">4</text>
        <text x="95" y="90" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="85" fontSize="11" fill="#333">5</text>
        <text x="95" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="135" fontSize="11" fill="#333">6</text>
        <text x="95" y="60" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="85" y="55" fontSize="11" fill="#0000FF">7</text>
        <text x="120" y="45" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="130" y="45" fontSize="11" fill="#0000FF">9</text>
        <text x="65" y="145" fontSize="16" fontWeight="bold" fill="#FF0000" textAnchor="middle">O</text>
        <text x="175" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">NH₂</text>
        <text x="120" y="180" fontSize="14" fill="#666" textAnchor="middle">H</text>
        <text x="120" y="30" fontSize="12" fill="#666" textAnchor="middle">↓ to ribose</text>
      </svg>
    ),
    C: (
      <svg viewBox="0 0 240 240" className="w-full h-full">
        <line x1="120" y1="140" x2="145" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="125" x2="145" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="148" y1="125" x2="148" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="145" y1="95" x2="120" y2="80" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="95" y2="95" stroke="#000" strokeWidth="3"/>
        <line x1="117" y1="83" x2="92" y2="98" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="95" x2="95" y2="125" stroke="#000" strokeWidth="3"/>
        <line x1="95" y1="125" x2="120" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="98" y1="125" x2="123" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="145"y1="125" x2="170" y2="140" stroke="#000" strokeWidth="3"/>
        <line x1="148" y1="128" x2="173" y2="143" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="80" x2="120" y2="55" stroke="#000" strokeWidth="3"/>
        <line x1="120" y1="140" x2="120" y2="165" stroke="#000" strokeWidth="3"/>
        <text x="120" y="145" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="125" y="160" fontSize="11" fill="#0000FF">1</text>
        <text x="145" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="150" y="145" fontSize="11" fill="#333">2</text>
        <text x="145" y="90" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">N</text>
        <text x="150" y="105" fontSize="11" fill="#0000FF">3</text>
        <text x="120" y="75" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="125" y="65" fontSize="11" fill="#333">4</text>
        <text x="95" y="90" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="85" fontSize="11" fill="#333">5</text>
        <text x="95" y="130" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle">C</text>
        <text x="85" y="135" fontSize="11" fill="#333">6</text>
        <text x="175" y="145" fontSize="16" fontWeight="bold" fill="#FF0000" textAnchor="middle">O</text>
        <text x="120" y="50" fontSize="16" fontWeight="bold" fill="#0000FF" textAnchor="middle">NH₂</text>
        <text x="120" y="180" fontSize="14" fill="#666" textAnchor="middle">H</text>
        <text x="120" y="195" fontSize="12" fill="#666" textAnchor="middle">↓ to ribose</text>
      </svg>
    )
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-4 border-cyan-500 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b-2 border-cyan-500 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-cyan-300">{info.name}</h2>
          <button onClick={onClose} className="text-cyan-300 text-3xl font-bold hover:text-cyan-400">✕</button>
        </div>
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 mb-4" style={{backgroundColor: info.color + '20'}}>
            <div className="w-48 h-48 mx-auto">
              {structures[base]}
            </div>
            <p className="text-center mt-2 font-bold text-lg" style={{color: info.color}}>{info.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-cyan-900/30 p-3 rounded-xl border-2 border-cyan-500/50">
              <h3 className="font-bold text-cyan-200 mb-1 text-sm">Formula</h3>
              <p className="text-white text-lg">{info.formula}</p>
            </div>
            <div className="bg-cyan-900/30 p-3 rounded-xl border-2 border-cyan-500/50">
              <h3 className="font-bold text-cyan-200 mb-1 text-sm">Type</h3>
              <p className="text-white text-lg">{info.type}</p>
            </div>
            <div className="bg-cyan-900/30 p-3 rounded-xl border-2 border-cyan-500/50">
              <h3 className="font-bold text-cyan-200 mb-1 text-sm">Rings</h3>
              <p className="text-white text-lg">{info.rings}</p>
            </div>
            <div className="bg-cyan-900/30 p-3 rounded-xl border-2 border-cyan-500/50">
              <h3 className="font-bold text-cyan-200 mb-1 text-sm">H-Bonds</h3>
              <p className="text-white text-lg">{info.bonds}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-xl font-bold text-white">Close</button>
        </div>
      </div>
    </div>
  );
};

export default function DNASimulation() {
  const [seq, setSeq] = useState('ATGGTGCATCTGACTGAGGAG');
  const [mode, setMode] = useState('explorer');
  const [sound, setSound] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showNuc, setShowNuc] = useState(null);
  const [showFact, setShowFact] = useState(null);
  const containerRef = useRef();
  const sounds = useSoundEffects(sound);
  
  const showMsg = (t, ty = 'info') => {
    setMsg({t, ty});
    setTimeout(() => setMsg(null), 3000);
  };
  
  const getRand = () => {
    setSeq(Array.from({length: 16}, () => ['A','T','C','G'][Math.floor(Math.random() * 4)]).join(''));
    sounds.playClick();
    showMsg('Random!');
  };
  
  const getComp = s => s.split('').map(b => BASE_PAIRS[b]?.complement || 'N').join('');
  
  const copySeq = s => {
    sounds.playClick();
    navigator.clipboard.writeText(s);
    showMsg('Copied!', 'success');
  };
  
  const displayFact = () => {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    setShowFact(randomFact);
    sounds.playClick();
  };
  
  const nextFact = () => {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    setShowFact(randomFact);
    sounds.playClick();
  };
  
  const tabs = [
    {id: 'explorer', name: '3D Explorer', icon: '🧬'},
    {id: 'builder', name: 'DNA Builder', icon: '🔨'},
    {id: 'mutator', name: 'Mutations', icon: '⚗️'},
    {id: 'challenges', name: 'Challenges', icon: '🎮'}
  ];
  
  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <div className="bg-purple-900 text-white p-4 border-b border-cyan-500">
        <h1 className="text-3xl font-bold text-center">DNA Explorer Pro</h1>
        <p className="text-center text-sm text-cyan-200">Interactive 3D Visualization</p>
      </div>
      
      <div className="bg-gray-800 border-b border-gray-700 flex">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => {setMode(tab.id); sounds.playClick();}} 
            className={`px-6 py-3 font-semibold ${mode === tab.id ? 'bg-cyan-600 text-white border-b-4 border-cyan-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <span className="mr-2">{tab.icon}</span>{tab.name}
          </button>
        ))}
      </div>
      
      {msg && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className={`px-8 py-4 rounded-xl text-white font-bold ${msg.ty === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
            {msg.t}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        {mode === 'builder' ? (
          <DNABuilder 
            onSequenceBuilt={s => {setSeq(s); setMode('explorer'); showMsg('DNA built!', 'success');}} 
            onExit={() => setMode('explorer')} 
            sounds={sounds}
          />
        ) : mode === 'mutator' ? (
          <MutationGenerator 
            sequence={seq} 
            onApplyMutation={s => {setSeq(s); setMode('explorer'); showMsg('Applied!', 'success');}} 
            onExit={() => setMode('explorer')} 
            sounds={sounds}
          />
        ) : mode === 'challenges' ? (
          <GameMode onExitGame={() => setMode('explorer')} sounds={sounds}/>
        ) : (
          <div className="w-full h-full flex">
            <div className="w-80 bg-gray-900 text-white p-4 border-r border-cyan-500/30 overflow-y-auto">
              <div className="flex justify-between bg-gray-800/50 p-3 rounded-lg mb-4">
                <span className="text-cyan-300">Sound</span>
                <button 
                  onClick={() => {setSound(!sound); sounds.playClick();}} 
                  className={`px-4 py-2 rounded-lg font-bold ${sound ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  {sound ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-cyan-300 mb-3">DNA Sequence</h3>
                <input 
                  type="text" 
                  value={seq} 
                  onChange={e => setSeq(e.target.value.toUpperCase().replace(/[^ATCG]/g, ''))} 
                  className="bg-gray-900 text-white px-3 py-2 rounded w-full border border-cyan-500 font-mono text-sm mb-2"
                />
                <div className="flex gap-2 mb-3">
                  <button onClick={getRand} className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-bold">Random</button>
                </div>
                <div className="text-xs space-y-2">
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="flex justify-between mb-1">
                      <strong className="text-cyan-200">5'→3':</strong>
                    </div>
                    <div className="font-mono bg-gray-900 p-2 rounded text-cyan-300">{seq}</div>
                  </div>
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="flex justify-between mb-1">
                      <strong className="text-pink-200">3'→5':</strong>
                    </div>
                    <div className="font-mono bg-gray-900 p-2 rounded text-pink-300">{getComp(seq)}</div>
                  </div>
                </div>
                <button 
                  onClick={displayFact}
                  className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm font-bold"
                >
                  DNA Fact
                </button>
              </div>
              
              <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-500/30">
                <h3 className="text-lg font-bold mb-3 text-cyan-300">Nitrogenous Bases</h3>
                <p className="text-xs text-gray-300 mb-3 italic">Click on a base to view its chemical structure</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {base: 'A', name: 'Adenine', color: '#FF6B35'},
                    {base: 'T', name: 'Thymine', color: '#FF1493'},
                    {base: 'G', name: 'Guanine', color: '#4169E1'},
                    {base: 'C', name: 'Cytosine', color: '#32CD32'}
                  ].map(({base, name, color}) => (
                    <button 
                      key={base} 
                      onClick={() => {setShowNuc(base); sounds.playClick();}} 
                      className="flex flex-col items-center bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700 border-2 border-gray-600 hover:border-cyan-400"
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2" 
                        style={{backgroundColor: color}}
                      >
                        {base}
                      </div>
                      <span className="text-sm font-semibold text-gray-300">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div ref={containerRef} className="w-full h-full"/>
              <DNAScene seq={seq} containerRef={containerRef}/>
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                <span className="text-cyan-300 text-sm font-semibold">
                  Length: <span className="text-white">{seq.length}</span> bp
                </span>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/90 px-4 py-3 rounded-lg border-2 border-cyan-500/50">
                <h4 className="text-cyan-300 text-sm font-bold mb-2">Controls</h4>
                <div className="text-xs text-white space-y-1">
                  <p>🖱️ <span className="text-gray-300">Mouse drag:</span> Rotate view</p>
                  <p>🔍 <span className="text-gray-300">Scroll:</span> Zoom in/out</p>
                  <p>🎨 <span className="text-gray-300">Interactive 3D</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showNuc && <ChemicalModal base={showNuc} onClose={() => setShowNuc(null)}/>}
      {showFact && <FactsModal fact={showFact} onClose={() => setShowFact(null)} onNext={nextFact}/>}
    </div>
  );
}
