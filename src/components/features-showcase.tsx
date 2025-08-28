'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Wand2, Pencil, Eye, Target, Save, Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <FileText className="w-8 h-8 mb-4 text-primary" />,
    title: 'Profile Analysis',
    description: "To shine, you must first be seen.",
  },
  {
    icon: <Wand2 className="w-8 h-8 mb-4 text-primary" />,
    title: 'Ad Generation',
    description: "Creativity is the spotlight on genius.",
  },
  {
    icon: <Target className="w-8 h-8 mb-4 text-primary" />,
    title: 'Audience Targeting',
    description: "Right light, right target, right time.",
  },
  {
    icon: <Eye className="w-8 h-8 mb-4 text-primary" />,
    title: 'Ad Preview',
    description: "See your vision come to life.",
  },
  {
    icon: <BrainCircuit className="w-8 h-8 mb-4 text-primary" />,
    title: 'AI Enhancement',
    description: "Your brand, reimagined with intelligence.",
  },
  {
    icon: <Save className="w-8 h-8 mb-4 text-primary" />,
    title: 'Save & Export',
    description: "Growth isn’t a guess—it’s guaranteed.",
  },
];

export function FeaturesShowcase() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto mt-24 mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tight animated-gradient-text">How It Works</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Turn Instagram profiles into powerful ad campaigns in a few clicks.
        </p>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={itemVariants} whileHover={{ y: -8, scale: 1.05 }}>
            <Card className="text-center h-full bg-card/50 hover:bg-secondary/20 transition-all duration-300 border-primary/10 hover:border-primary/40 shadow-lg hover:shadow-primary/20">
              <CardHeader className="flex flex-col items-center">
                <motion.div
                  whileHover={{ rotate: [0, 10, -10, 0], scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{feature.description}"</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
